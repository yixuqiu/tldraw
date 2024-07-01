import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import kleur from 'kleur'
import stripAnsi from 'strip-ansi'

// at the time of writing, workerd will regularly crash with a segfault
// but the error is not caught by the process, so it will just hang
// this script wraps the process, tailing the logs and restarting the process
// if we encounter the string 'Segmentation fault'
class MiniflareMonitor {
	private process: ChildProcessWithoutNullStreams | null = null

	constructor(
		private command: string,
		private args: string[] = []
	) {}

	public start(): void {
		this.stop() // Ensure any existing process is stopped
		console.log(`Starting wrangler...`)
		this.process = spawn(this.command, this.args, {
			env: {
				NODE_ENV: 'development',
				...process.env,
			},
		})

		this.process.stdout.on('data', (data: Buffer) => {
			this.handleOutput(stripAnsi(data.toString().replace('\r', '').trim()))
		})

		this.process.stderr.on('data', (data: Buffer) => {
			this.handleOutput(stripAnsi(data.toString().replace('\r', '').trim()), true)
		})
	}

	private handleOutput(output: string, err = false): void {
		if (!output) return
		if (output.includes('Segmentation fault')) {
			console.error('Segmentation fault detected. Restarting Miniflare...')
			this.restart()
		} else if (!err) {
			console.log(output.replace('[mf:inf]', '')) // or handle the output differently
		}
	}

	private restart(): void {
		console.log('Restarting wrangler...')
		this.stop()
		setTimeout(() => this.start(), 3000) // Restart after a short delay
	}

	private stop(): void {
		if (this.process) {
			this.process.kill()
			this.process = null
		}
	}
}

class SizeReporter {
	lastLineTime = Date.now()
	nextTick?: NodeJS.Timeout

	size = 0

	start() {
		console.log('Spawning size reporter...')
		const proc = spawn('yarn', [
			'run',
			'-T',
			'esbuild',
			'src/worker.ts',
			'--bundle',
			'--minify',
			'--watch',
			'--external:cloudflare:*',
			'--target=esnext',
			'--format=esm',
		])
		// listen for lines on stdin
		proc.stdout.on('data', (data) => {
			this.size += data.length
			this.lastLineTime = Date.now()
			clearTimeout(this.nextTick)
			this.nextTick = setTimeout(() => {
				console.log(
					kleur.bold(kleur.yellow('worker')),
					'is roughly',
					kleur.bold(kleur.cyan(Math.floor(this.size / 1024) + 'kb')),
					'(minified)\n'
				)
				this.size = 0
			}, 10)
		})
		proc.stderr.on('data', (data) => {
			console.log(data.toString())
		})
		process.on('SIGINT', () => {
			console.log('Int')
			proc.kill()
		})
		process.on('SIGTERM', () => {
			console.log('Term')
			proc.kill()
		})
		process.on('exit', () => {
			console.log('Exiting')
			proc.kill()
		})
	}
}

new MiniflareMonitor('wrangler', [
	'dev',
	'--env',
	'dev',
	'--test-scheduled',
	'--log-level',
	'info',
	'--var',
	'IS_LOCAL:true',
]).start()

new SizeReporter().start()

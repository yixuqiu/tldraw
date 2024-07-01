export const BOOKMARK_ENDPOINT = '/api/unfurl'

// some boilerplate to get the URL of the server to upload/fetch assets

if (!process.env.ASSET_UPLOAD) {
	throw new Error('Missing ASSET_UPLOAD env var')
}

if (!process.env.ASSET_BUCKET_ORIGIN) {
	throw new Error('Missing ASSET_BUCKET_ORIGIN env var')
}

export const ASSET_UPLOADER_URL: string = process.env.ASSET_UPLOAD

export const ASSET_BUCKET_ORIGIN: string = process.env.ASSET_BUCKET_ORIGIN

export const CONTROL_SERVER: string =
	process.env.NEXT_PUBLIC_CONTROL_SERVER || 'http://localhost:3001'

if (!process.env.MULTIPLAYER_SERVER) {
	throw new Error('Missing MULTIPLAYER_SERVER env var')
}
export const MULTIPLAYER_SERVER = process.env.MULTIPLAYER_SERVER.replace(/^http/, 'ws')

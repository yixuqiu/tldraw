import { HistoryEntry, MigrationSequence, SerializedStore, Store, StoreSchema } from '@tldraw/store'
import {
	SchemaShapeInfo,
	TLRecord,
	TLStore,
	TLStoreProps,
	TLUnknownShape,
	createTLSchema,
} from '@tldraw/tlschema'
import { TLShapeUtilConstructor } from '../editor/shapes/ShapeUtil'
import { TLAnyShapeUtilConstructor, checkShapesAndAddCore } from './defaultShapes'

/** @public */
export type TLStoreOptions = {
	initialData?: SerializedStore<TLRecord>
	defaultName?: string
	id?: string
} & (
	| { shapeUtils?: readonly TLAnyShapeUtilConstructor[]; migrations?: readonly MigrationSequence[] }
	| { schema?: StoreSchema<TLRecord, TLStoreProps> }
)

/** @public */
export type TLStoreEventInfo = HistoryEntry<TLRecord>

/**
 * A helper for creating a TLStore. Custom shapes cannot override default shapes.
 *
 * @param opts - Options for creating the store.
 *
 * @public */
export function createTLStore({
	initialData,
	defaultName = '',
	id,
	...rest
}: TLStoreOptions): TLStore {
	const schema =
		'schema' in rest && rest.schema
			? // we have a schema
				rest.schema
			: // we need a schema
				createTLSchema({
					shapes: currentPageShapesToShapeMap(
						checkShapesAndAddCore('shapeUtils' in rest && rest.shapeUtils ? rest.shapeUtils : [])
					),
					migrations: 'migrations' in rest ? rest.migrations : [],
				})

	return new Store({
		id,
		schema,
		initialData,
		props: {
			defaultName,
		},
	})
}

function currentPageShapesToShapeMap(shapeUtils: TLShapeUtilConstructor<TLUnknownShape>[]) {
	return Object.fromEntries(
		shapeUtils.map((s): [string, SchemaShapeInfo] => [
			s.type,
			{
				props: s.props,
				migrations: s.migrations,
			},
		])
	)
}

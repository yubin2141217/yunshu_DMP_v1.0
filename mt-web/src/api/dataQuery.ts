import { queryDataRecords, type DataQueryFilter } from '@/mock/dataQuery'

function delay(ms = 220) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function listDataQuery(params: DataQueryFilter) {
  await delay()
  return queryDataRecords(params)
}

export {
  dataFlowOptions,
  dataQueryRangeOptions,
  getDataQuerySchemeOptions,
  getDataQueryFieldMeta,
  type DataFlow,
  type DataQueryRange,
  type DataQueryFilter,
  type DataQueryRow,
  type DataQueryFieldMeta,
} from '@/mock/dataQuery'

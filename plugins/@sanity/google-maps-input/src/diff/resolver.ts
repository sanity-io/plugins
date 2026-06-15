import {DiffComponentResolver} from 'sanity'
import {GeopointFieldDiff} from './GeopointFieldDiff'
import {GeopointArrayDiff} from './GeopointArrayDiff'
import {GeopointRadiusFieldDiff} from './GeopointRadiusFieldDiff'

const diffResolver: DiffComponentResolver = function diffResolver({schemaType}) {
  if (schemaType.name === 'geopoint') {
    return GeopointFieldDiff
  }

  if (schemaType.name === 'geopointRadius') {
    return GeopointRadiusFieldDiff
  }

  if (
    schemaType.jsonType === 'array' &&
    schemaType.of.length === 1 &&
    schemaType.of[0].name === 'geopoint'
  ) {
    return GeopointArrayDiff
  }

  return undefined
}

export default diffResolver

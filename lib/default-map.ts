import type { MapFile } from './agv-types'

export const DEFAULT_MAP_ID = 'map-default-site'

export const DEFAULT_MAP_YAML = `image: default-site-map.pgm
resolution: 0.050000
origin: [-21.250000, -35.949999, 0]
negate: 0
occupied_thresh: 0.65
free_thresh: 0.196
`

export const defaultMapFile: MapFile = {
  id: DEFAULT_MAP_ID,
  name: '默认站点地图',
  pgmFileName: 'default-site-map.pgm',
  yamlFileName: 'default-site-map.yaml',
  pgmData: '/maps/default-site-map.pgm',
  yamlData: DEFAULT_MAP_YAML,
  previewImageUrl: '/maps/default-site-map-preview.png',
  resolution: 0.05,
  origin: [-21.25, -35.949999, 0],
  width: 838,
  height: 1322,
  createdAt: new Date('2026-03-13T11:19:29+08:00'),
  updatedAt: new Date('2026-03-13T11:19:31+08:00'),
}

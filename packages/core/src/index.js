// Core entry: export generators and utilities implemented under ./scripts
const {
  generateCustom,
  GENERATORS,
  NAME_BY_KEY,
} = require('./scripts/generate-custom.js');
const {
  imageToDots,
  pointsToSVGPage,
  pointsToSVGMulti,
} = require('./scripts/image_path_to_dots_processor.js');

module.exports = {
  generateCustom,
  GENERATORS,
  NAME_BY_KEY,
  imageToDots,
  pointsToSVGPage,
  pointsToSVGMulti,
};

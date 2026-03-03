import yaml from "js-yaml";

export default function () {
  // Get the config.yml stored as env variable data.
  const config = process.env.CONFIG_DATA;
  const configYaml = yaml.loadAll(config, 'utf8', '');

  // return object with all file data using the first key of the object.
  return  configYaml.reduce((acc, obj) => {
    const key = Object.keys(obj)[0];
    acc[key] = obj[key];
    return acc;
  }, {});
}
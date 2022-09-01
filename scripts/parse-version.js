module.exports = async ({github, context, core}) => {
  // set the release ref from input or from event
  let release_ref = undefined;

  switch (context.eventName) {
    case 'release':
      release_ref = context.ref;
      break;
    case 'workflow_dispatch':
      release_ref = `refs/tags/${context.payload.inputs.release_tag}`;
      break;
    default:
      const message = `Unexpected event type for parsing release: ${context.eventName}`;
      core.exportVariable(`ERROR_MESSAGES`, `${message}\n${process.env.ERROR_MESSAGES}`);
      core.setFailed(`message`);
      core.startGroup(`Outputting context...`);
      core.info(JSON.stringify(context));
      core.endGroup();
      return;
  }

  core.info(`Using release reference: ${release_ref}`);

  // parse release ref into parts
  const regex = /^refs\/tags\/v([1-4])\.(\d+)\.(\d+)$/;
  const matched = release_ref.match(regex);

  // cannot continue without a parsable version number
  if (matched === null || matched.length !== 4) {
    const message = `Unable to parse "${release_ref}" into major, minor, and patch version numbers. If a release was made in error, delete the release *and* tag (2 separate steps).`; 
    core.exportVariable(`ERROR_MESSAGES`, `${message}\n${process.env.ERROR_MESSAGES}`);
    core.setFailed(message);
    return;
  }

  const out = {};
  out.version_major = parseInt(matched[1]);
  out.version_minor = parseInt(matched[2]);
  out.version_patch = parseInt(matched[3]);
  out.release_tag = `v${out.version_major}.${out.version_minor}.${out.version_patch}`;

  // output and set result
  core.startGroup('Setting output...');
  for (const property in out) {
    console.log(`${property}: ${out[property]}`);
    core.setOutput(property, out[property]);
  }
  core.endGroup();

  return out;
};

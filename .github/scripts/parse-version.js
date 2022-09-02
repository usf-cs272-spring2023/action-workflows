module.exports = async ({github, context, core}) => {
  // set the release ref from input or from event
  let release_ref = undefined;
  let release_id = undefined;

  switch (context.eventName) {
    case 'release':
      release_ref = context.ref;
      release_id = context.payload.release.id;
      break;

    case 'workflow_dispatch':
      try {
        const response = await github.rest.repos.getReleaseByTag({
          owner: context.repo.owner,
          repo: context.repo.repo,
          tag: context.payload.inputs.release_tag
        });

        if (response.status !== 200) {
          throw new Error(`Status ${response.status}`);
        }

        release_ref = `refs/tags/${response.data.tag_name}`;
        release_id = response.data.id;
      }
      catch (error) {
        core.setFailed(`Unable to fetch release ${release_ref} (${error.message}).`);
        return;
      }

      break;

    default:
      core.setFailed(`Unexpected event type for parsing release: ${context.eventName}`);
      return;
  }

  core.info(`Using release reference: ${release_ref} (id ${release_id})`);

  // parse release ref into parts
  const regex = /^refs\/tags\/v([1-4])\.(\d+)\.(\d+)$/;
  const matched = release_ref.match(regex);

  // cannot continue without a parsable version number
  if (matched === null || matched.length !== 4) {
    core.setFailed(`Unable to parse "${release_ref}" into major, minor, and patch version numbers. If a release was made in error, delete the release *and* tag (2 separate steps).`);
    return;
  }

  const out = {};
  out.version_major = parseInt(matched[1]);
  out.version_minor = parseInt(matched[2]);
  out.version_patch = parseInt(matched[3]);

  out.release_tag = `v${out.version_major}.${out.version_minor}.${out.version_patch}`;
  out.release_id  = release_id;

  // output and set result
  core.startGroup('Setting output...');
  for (const property in out) {
    console.log(`${property}: ${out[property]}`);
    core.setOutput(property, out[property]);
  }
  core.endGroup();

  return out;
};

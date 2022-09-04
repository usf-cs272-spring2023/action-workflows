// checks the releases to determine if the major number makes sense
// and which requests can be made based on the past results
module.exports = async ({github, context, core, fs, artifact}) => {
  const release = process.env.RELEASE_TAG;
  const major = parseInt(process.env.VERSION_MAJOR);
  const minor = parseInt(process.env.VERSION_MINOR);
  const patch = parseInt(process.env.VERSION_PATCH);

  core.info(`Release: ${release}, Project: ${major}, Review: ${minor}, Patch: ${patch}`);

  const results = process.env.RESULTS;
  const json = JSON.parse(results);

  for (const property in json) {
    if (json[property].hasOwnProperty('outputs')) {
      if (json[property]['outputs'].hasOwnProperty('status')) {
        const parsed = JSON.parse(json[property]['outputs']['status']);
        json[property]['outputs']['status'] = parsed;
      }
    }
  }

  core.startGroup('Outputting job status...');
  core.info(JSON.stringify(json, null, '  '));
  core.endGroup();

  const output = {
    artifact: 'check-release-results',
    filename: 'check-release-results.json',

    release: release,
    release_date: undefined,
    
    project: undefined,

    check_tests: false,
    check_style: false,

    grade_tests:  false,
    grade_review: false,
    grade_design: false,

    request_review: false
  };

  try {

  }
  catch (error) {
    core.info(`${error.name}: ${error.message}`);
    core.setFailed(`Could not fully verify results of the ${release} release.`);
  }
  finally {
    core.startGroup('Uploading artifact...');
    fs.writeFileSync(output.filename, JSON.stringify(output));
  
    const client = artifact.create();
    const response = await client.uploadArtifact(output.basename, [filename], '.');
    core.info.log(`Uploaded: ${JSON.stringify(response)}`);
    core.endGroup();
  }
};
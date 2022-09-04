// checks the releases to determine if the major number makes sense
// and which requests can be made based on the past results
module.exports = async ({github, context, core, fs}) => {
  const release = process.env.RELEASE_TAG;
  const major = parseInt(process.env.VERSION_MAJOR);
  const minor = parseInt(process.env.VERSION_MINOR);
  const patch = parseInt(process.env.VERSION_PATCH);

  core.info(`Release: ${release}, Project: ${major}, Review: ${minor}, Patch: ${patch}`);

  const output = {
    artifact: 'check-release-results',
    filename: 'check-release-results.json',

    release: release,
    release_date: undefined,
    
    project: major,

    check_tests: false,
    check_style: false,

    grade_tests:  false,
    grade_review: false,
    grade_design: false,

    request_review: false
  };

  try {
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

    output.release_date = json?.check_tests?.outputs?.status?.parse_release?.outputs?.release_date;
    output.check_tests = json?.check_tests?.result === 'success';
    output.check_style = json?.check_style?.result === 'success';
  }
  catch (error) {
    core.info(`${error.name}: ${error.message}`);
    core.setFailed(`Could not fully verify results of the ${release} release.`);
  }
  finally {
    fs.writeFileSync(output.filename, JSON.stringify(output));

    core.startGroup('Setting output...');
    for (const property in output) {
      core.info(`${property}: ${output[property]}`);
      core.setOutput(property, output[property]);
    }
    core.endGroup();
  }
};
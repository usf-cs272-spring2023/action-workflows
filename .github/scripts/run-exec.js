// nicer exec output than running commands in bash shell
module.exports = async ({exec, core}) => {
  const command = 'grep'
  const args = ['-rnoE', '--exclude=Driver.java', '\\s*public\\s+static\\s+void\\s+main\\s*\\('];
  const cwd = `${process.env.USER_PATH}/src/main/java`;
  const message = `Except for Driver.java, you should delete old main methods from your code.`;
  const options = {ignoreReturnCode: true, cwd: cwd};



  core.info('potato');
  const result = await exec.exec(command, args, options);

  core.info('pancake');

  if (result !== 0) {
    core.info(result);
    core.setFailed(message);
  }
};



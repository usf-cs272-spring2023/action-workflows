// nicer exec output than running commands in bash shell
module.exports = async ({exec, core}) => {
  const command = 'grep'
  const args = ['-rnoE', '--exclude=Driver.java', "'\\s*public\\s+static\\s+void\\s+main\\s*\\('"];
  const cwd = `${process.env.USER_PATH}/src/main/java`;
  const message = `Except for Driver.java, you should delete old main methods from your code.`;

  const options = {ignoreReturnCode: true, cwd: cwd};

  let output = '';
  let errors = '';

  options.listeners = {
    stdout: (data) => {
      output += Buffer.from(data).toString();
    },
    stderr: (data) => {
      errors += Buffer.from(data).toString();
    }
  };

  core.info('pizza');
  const result = await exec.exec(command, args, options);

  core.info(output);
  core.error(errors);

  if (result !== 0) {
    core.info(result);
    core.setFailed(message);
  }
};



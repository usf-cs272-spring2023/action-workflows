// nicer exec output than running commands in bash shell
module.exports = async ({exec, core}) => {
  const command = 'grep'
  const args = ['-rnoE', '--exclude=Driver.java', '\\s*public\\s+static\\s+void\\s+main\\s*\\('];
  const cwd = `${process.env.USER_PATH}/src/main/java`;
  const message = `Except for Driver.java, you should delete old main methods from your code. See the run logs for details.`;
  const options = {ignoreReturnCode: true, cwd: cwd};
  const result = await exec.exec(command, args, options);

  if (result !== 1) {
    core.setFailed(message);
  }
};



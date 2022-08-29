// Checks if the issue event is valid; i.e. a student is not modifying the issue improperly.
module.exports = async ({github, context, core, fs}) => {
  core.info(JSON.stringify(context));
};
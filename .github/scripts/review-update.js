// updates the pull request based on the submitted review
module.exports = async ({github, context, core}) => {
  try {

    core.info(context, null, '  ');

    const comment = {
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: process.env.COMMENT_ID
    };

    const request = {
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.payload.issue.number
    };


    core.startGroup('Outputting parameters...');
    core.info(comment, null, '  ');
    core.info(request, null, '  ');
    core.endGroup();

    // update comment 


    // update request


    // run both requests at same time

  }
  catch (error) {
    core.info(`${error.name}: ${error.message}`);

    core.startGroup('Outputting context...');
    core.info(JSON.stringify(context));
    core.endGroup();

    core.setFailed(`Unable to update pull request #${context?.payload?.issue?.number}.`);
  }
};
// updates the issue comment with the successful request
module.exports = async ({github, context, core}) => {
  const results = JSON.parse(process.env.RESULTS);
  const request_type = results.parse_request.outputs.request_type;
  core.info(`Request Type: ${request_type}`);

  try {
    const comment_id = process.env.COMMENT_ID;
    let message = undefined;

    if (request_type.startsWith('grade_')) {
      const release_tag = results?.parse_request?.outputs?.release_tag;
      const release_link = `https://github.com/${context.repo.owner}/${context.repo.repo}/releases/tag/${release_tag}`;
      
      const run_id = results?.find_release?.outputs?.run_id;
      const run_link = `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${run_id}`;

      const late_interval   = results?.calculate_grade?.outputs?.late_interval;
      const late_multiplier = results?.calculate_grade?.outputs?.late_multiplier;
      const late_points     = results?.calculate_grade?.outputs?.late_points;
      const late_percent    = results?.calculate_grade?.outputs?.late_percent;
      const grade_points    = results?.calculate_grade?.outputs?.grade_points;
      const grade_possible  = results?.calculate_grade?.outputs?.grade_possible;
      const grade_percent   = results?.calculate_grade?.outputs?.grade_percent;

      message = `
:octocat: @${ context.actor }, your [grade request](https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}) has been processed! See the details below:

|  |  |
|----:|:-----|
|  Student: | ${results?.parse_request?.outputs?.name} |
| Username: | \`${results?.parse_request?.outputs?.user}\` |
| | |
| Assignment: | ${results?.calculate_grade?.outputs?.assignment_name} |
|    Release: | [\`${release_tag}\`](${release_link}) (verified in [run ${run_id}](${run_link})) |
|   Deadline: | ${results?.calculate_grade?.outputs?.deadline_text} |
|  Submitted: | ${results?.calculate_grade?.outputs?.submitted_text} |
| | |
| Late&nbsp;Interval: | ${late_interval} hours (x${late_multiplier} multiplier) |
| Late&nbsp;Penalty:  | -${late_points} points (-${late_percent}%) |
| Late&nbsp;Grade:    | **${grade_points}** / ${grade_possible} points (${grade_percent}%) |

:white_check_mark: We will close this issue after updating your grade on Canvas. If your grade is not updated in 2 business days, please reach out on Piazza.
      `;
    }
    else if (request_type == 'request_review') {
      message = `:octocat: @${ context.actor }, this is an [unexpected request type](https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}). Please reach out to the instructor on Piazza.`;
      core.warning(`Unexpected request type: ${request_type}`);
    }
    else {
      message = `:octocat: @${ context.actor }, this is an [unexpected request type](https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}). Please reach out to the instructor on Piazza.`;
      core.warning(`Unexpected request type: ${request_type}`);
    }

    // update issue comment
    const updated = await github.rest.issues.updateComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: comment_id,
      body: message
    });
  }
  catch (error) {
    core.info(`${error.name}: ${error.message}`);
    core.setFailed(`Unable to update comment for issue #${context?.payload?.issue?.number}.`);
  }

  try {
    const labels = JSON.parse(results.verify_request.outputs.labels);
    const assignees = ['mtquach2', 'par5ul1', 'igentle292'];
    const milestone_id = results.get_milestone.outputs.milestone_id;
    const state = request_type.startsWith('grade_') ? 'open' : 'closed';

    core.info('');
    core.info(`   Labels: ${labels.join(', ')}`);
    core.info(`Assignees: ${assignees.join(', ')}`);
    core.info(`Milestone: ${milestone_id}`);
    core.info(`    State: ${state}`);

    const updated = await github.rest.issues.update({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.payload.issue.number,
      labels: labels,
      assignees: assignees,
      milestone: milestone_id,
      state: state
    });

    core.info('');
    core.info(`Updated issue #${context?.payload?.issue?.number} with successful request.`);
  }
  catch (error) {
    core.info(`${error.name}: ${error.message}`);

    core.startGroup('Outputting context...');
    core.info(JSON.stringify(context));
    core.endGroup();

    core.setFailed(`Unable to update results for issue #${context?.payload?.issue?.number}.`);
  }  
};
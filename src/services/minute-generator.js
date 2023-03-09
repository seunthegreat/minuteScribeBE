require('dotenv').config();
const { Configuration, OpenAIApi } = require("openai");

//--Setting up OpenAI--//
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const model = 'text-davinci-002';

const getResponse = ( model, prompt) => ({
  model,
  prompt,
  max_tokens: 1000,
  n: 1,
  stop: null,
  temperature: 0.5
})

const generateMinute = async (req, res) => {
  const { agenda, date, location, summary, attendees = [], decisionMade = [] } = req.body;

  //--Check if required fields are present--//
  if (!agenda || !date || !location || !summary) {
    return res.status(400).send({ error: 'Missing required fields' });
  }

  //--Format attendees as a comma-separated list of names--//
  const attendeesList = attendees.map(a => a.name).join(', ');
  const decisionList = decisionMade.map(a => a.name).join(', ');

  let okr = {};

  // Generate objectives from summary
  const objectivePrompt = `Generate an overall objective from the following summary: ${summary} in a formal meeting`;
  try {
    const objectiveResponse = await openai.createCompletion(getResponse(model, objectivePrompt));
    const objectives = objectiveResponse.data.choices[0].text.trim().split('.').slice(0, 2); // Get first two objectives
    const okrPrompts = objectives.map(objective => {
      return `Generate key results for the following objective: ${objective.trim()}`;
    });
    const okrResponses = await Promise.all(okrPrompts.map(prompt => openai.createCompletion(getResponse(model, prompt))));
    const okrObjects = okrResponses.map((response, index) => {
      const keyResults = response.data.choices[0].text.trim();
      const objective = objectives[index].trim();
      if (keyResults) {
        const keyResultsArray = keyResults.split('.').filter(kr => kr.trim() !== '');
        okr[objective] = keyResultsArray.map(kr => ({ id: Math.random().toString(36).substr(2, 9), result: kr.trim() }));
      } else {
        okr[objective] = [];
      }
    });
  } catch (error) {
    console.log(error);
  }

  const purposePrompt = `Generate the purpose of a meeting with ${agenda}. without using the word purpose`;
  const keyTopicsPrompt = `Identify and highlight a list of important topics which can be keywords discussed using the minute summary of ${summary}. Keep topics simple, concise, rephrased and no more than 10 words each.`;
  const summaryPrompt = `Generate a professional meeting minute with the following attendees: ${attendeesList}, which took place in ${location} at ${date} with a summary of ${summary}. Elaborate on the summary,
    and also include date and location of the meeting"`;
  const decisionPrompt = `Generate a professional meeting minute with the following attendees: ${attendeesList} with decisions made as ${decisionList}`;

  try {
    const [purposeResponse, topicsResponse, summaryResponse, decisionResponse] = await Promise.all([
      openai.createCompletion(getResponse(model, purposePrompt)),
      openai.createCompletion(getResponse(model, keyTopicsPrompt)),
      openai.createCompletion(getResponse(model, summaryPrompt)),
      openai.createCompletion(getResponse(model, decisionPrompt))
    ]);

    const formattedSummary = summaryResponse.data.choices[0].text.split('\n')[2];
    const formattedDecision = decisionResponse.data.choices[0].text.split('\n')[2];
    const formattedPurpose = purposeResponse.data.choices[0].text.split('\n')[2];
    const formattedTopics = topicsResponse.data.choices[0].text.split('\n');

    const keyTopics = [];
    let currentTopic = '';

    for (let i = 0; i < formattedTopics.length; i++) {
      const topic = formattedTopics[i].trim();
      if (topic === '') {
        continue;
      }

      if (currentTopic === '') {
        currentTopic = topic;
      } else {
        currentTopic += ` ${topic}`;
      }

      if (currentTopic.length > 10 || i === formattedTopics.length - 1) {
        keyTopics.push({ id: Math.random().toString(36).substr(2, 9), topic: currentTopic });
        currentTopic = '';
      }
    }

    const title = agenda;
    const summary = `${formattedSummary} ${formattedDecision}`;
    const purpose = formattedPurpose

    res.send({
      response: {
        title,
        summary,
        purpose,
        keyTopics,
        objective: Object.keys(okr)[0],
        keyResults: okr[Object.keys(okr)[0]]
      }
    });
  } catch (error) {
    if (error.response) {
      console.log("Error status", error.response.status);
      console.log("error data ", error.response.data);
    } else {
      console.log(error.purpose);
    }
    res.status(500).send({ error: 'Error generating meeting minute' });
  }
};

module.exports = { generateMinute };

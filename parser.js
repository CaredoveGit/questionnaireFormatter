// Store the elements where the markup will be applied
var qrSection = document.getElementById('QuestionnaireResponse');
var qrJSONInput = document.getElementById('jsonInput');
var qrSubmitButton = document.getElementById('submit');
var qrDropdownBox = document.getElementById('jsonDropdown');
var qrRuleErrorDiv = document.getElementById('ruleErrorDiv');
var errors = [];

// Initial JSON load
const qrSampleRequestURL = 'sample.json';
const qrSampleNoHeadersRequestURL = 'samplenoheaders.json';
const qrExampleHomecareRequestURL = 'samplehomecareref.json';
const qrSampleSimpleRequestURL = 'qrsample-simple.json';
const qrSampleMediumRequestURL = 'qrsample-medium.json';
const qrSampleComplexRequestURL = 'qrsample-complex.json';
const qrFHIRNorth2019ExerciseURL = 'fhirnorth2019.json';
const qrSampleStandardURL = 'qrsample-standard-question.json';
const qrSampleDisplayTextURL = 'qrsample-displaytext.json';
const qrSampleGroupHeadersURL = 'qrsample-groupheaders.json';
const qrSampleNestedURL = 'qrsample-nestedquestions.json';
const qrSampleNestedErrorUrl = 'qrsample-complex-nest.json';


getJSONData(qrSampleRequestURL);

/* Receives a URL pointing to a JSON file parses through the retrived data, stores
it in the textarea for editing, and updates the page to display it */
function getJSONData(URL) {
    let qrRequest = new XMLHttpRequest();
    qrRequest.open('GET', URL);
    qrRequest.responseType = 'json';
    qrRequest.send();

    /* When the JSON loads, call the function to populate the payload data onto the
    webpage and populate the text-area with a text version of the data for testing */
    qrRequest.onload = function() {
        let qResponse = qrRequest.response;
        qrJSONInput.textContent = JSON.stringify(qResponse, undefined, 3);
        populateResponse(qResponse);
    };
}

// Event Listener for the dropdown box
qrDropdownBox.addEventListener('change', event => {
    const result = event.target.value;

    clearJSONResults();
    if (result == 1) {
        getJSONData(qrSampleRequestURL);
    }
    if (result == 2) {
        getJSONData(qrSampleNoHeadersRequestURL);
    }
    if (result == 3) {
        getJSONData(qrExampleHomecareRequestURL);
    }
    if (result == 4) {
        getJSONData(qrSampleSimpleRequestURL);
    }
    if (result == 5) {
        getJSONData(qrSampleMediumRequestURL);
    }
    if (result == 6) {
        getJSONData(qrSampleComplexRequestURL);
    }
    if (result == 8) {
        getJSONData(qrSampleStandardURL);
    }
    if (result == 9) {
        getJSONData(qrSampleDisplayTextURL);
    }
    if (result == 10) {
        getJSONData(qrSampleGroupHeadersURL);
    }
    if (result == 11) {
        getJSONData(qrSampleNestedURL);
    }
    if (result == 12) {
        getJSONData(qrSampleNestedErrorUrl);
    }
});

// Event Listener for the submit button
qrSubmitButton.addEventListener('click', function(event) {
    clearJSONResults();

    // Populate the page with new data taken from the textview
    let updateText = qrJSONInput.value;
    try{
    let updatedJSON = JSON.parse(updateText);
    populateResponse(updatedJSON);
    }
    catch(err)
    {
        errors.push(err);
        handleErrors();
    }

});
/* Parse through the JSON file, checking for nested and conditional properties,
then displaying all of the response contents to a section on the page */
function populateResponse(jsonObj) {
    /**
     *
     * @param {object} questionnaireResponse
     */

    const parse = questionnaireResponse => {
        if (questionnaireResponse.item) {
            parseItem(questionnaireResponse.item, 0);
        } else {
            console.log('Invalid Questionnaire Response.');
        }
    };

    /**
     *
     * @param {array} item
     */
    counter = 0;
    const parseItem = (item, depth) => {
        item.forEach(i => {
            // non-headers
            if (i.answer) {
                let line = renderQuestion(i, depth);
                qrSection.appendChild(line);
                //Check for rule error - (answer.exists() and item.exists()).not()
                if (i.item) 
                {
                    errsource = '';
                    subitemid = '';
                    if(item[counter].linkID!==undefined)
                    {
                        pitemid = item[counter].linkID;
                    }
                    else if(item[counter].linkId!==undefined)                    
                    {
                        pitemid = item[counter].linkId;
                    }
                    if(i.item[0]!==undefined)
                    {
                        if(i.item[0].linkID!==undefined)
                        {
                            subitemid = i.item[0].linkID;
                        }
                        else if(i.item[0].linkId!==undefined)                    
                        {
                            subitemid = i.item[0].linkId;
                        }
                    }
                    errsource = '<table width="35%" ><tr><td><i>Items in Error</i></td><td><b>linkID</b></td></tr><tr><td width="75%"><b>Parent Item</b></td><td>'+pitemid+'</td></tr><tr><td>'+'<b>SubItem</b></td><td>'+subitemid+'</td></tr></table>'
                    errors.push('A QuestionnaireResponse.item may NOT have both an item and an answer.</br></br>'+errsource+'</br> Please review this guideline for more information:</br> <a href="https://www.hl7.org/fhir/questionnaireresponse.html#invs" target="_blank">FHIR Questionnaire Respsonse</a>')
                }
                if (i.answer[0].hasOwnProperty('item')) {
                    let answer = renderAnswer(i.answer[0], depth);
                    line.appendChild(answer);
                    
                }
                parseAnswer(i.answer, line, depth + 1);
                 
            }else
            {
                if (!i.item) {
                    let line = renderText(i, depth);
                    qrSection.appendChild(line);
                 }
            }

            if (i.item) {
                 // headers
                if (depth < 1) {
                    if (!i.answer) {
                        let line = renderHeader(i, depth);
                        qrSection.appendChild(line);
                        parseItem(i.item, depth);
                    } else {
                        parseItem(i.item, depth + 1);
                    }
                }

                if (depth >= 1) {
                    // sub headers
                    if (!i.answer) {
                        let line = renderHeader(i, depth);
                        qrSection.appendChild(line);
                        parseItem(i.item, depth);
                    } else {
                        parseItem(i.item, depth + 1);
                    }
                }
            }
        });
        
        if (depth < 1) {
            counter = counter +1;
        }
    };

    /**
     *
     * @param {array} answer
     */
    const parseAnswer = (answer, line, depth) => {
        answer.forEach(e => {
            if (e.item) {
                // conditional sub-question
                parseItem(e.item, depth);
            } else {
                // Multi-select answers
                if (answer.length > 1 && answer.indexOf(e) != answer.length - 1) {
                    let answerHTML = renderMultiAnswer(e, depth);
                    line.appendChild(answerHTML);

                    // Single answers
                } else {
                    let answerHTML = renderAnswer(e, depth);
                    line.appendChild(answerHTML);
                }
                if (typeof e.scoreInteger !== 'undefined') {
                        if (Number.isInteger(e.scoreInteger)) {
                            line.append(renderScore(e.scoreInteger));
                        }
                    }
            }
        });
    };

    parse(jsonObj);
    handleErrors();
}

/* Takes an answer object, destructures it and determines which types and
 values it is holding then returns the value as a string. Returns an empty
  string if it does not contain a supported type */
function getAnswerText({
    valueBoolean,
    valueDecimal,
    valueInteger,
    valueDate,
    valueDateTime,
    valueTime,
    valueString,
    valueUri,
    valueAttachment,
    valueCoding,
    valueQuantity,
    valueCalculation
}) {
    let response = '';

    if (typeof valueBoolean !== 'undefined') {
        if (valueBoolean === true || valueBoolean === false) {
            response += valueBoolean;
        } else {
            errors.push('valueBoolean can only be a true or false value');
        }
    }

    if (typeof valueDecimal !== 'undefined') {
        response += valueDecimal;
        console.log((typeof valueDecimal).toString());
    }

    if (typeof valueInteger !== 'undefined') {
        if (Number.isInteger(valueInteger)) {
            response += valueInteger;
        } else {
            errors.push('valueInteger must be a valid Integer value');
        }
        response += valueInteger;
    }

    if (typeof valueDate !== 'undefined') {
        response += valueDate;
    }

    if (typeof valueDateTime !== 'undefined') {
        response += valueDateTime;
    }

    if (typeof valueTime !== 'undefined') {
        response += valueTime;
    }

    if (typeof valueString !== 'undefined') {
        response += valueString;
    }

    if (typeof valueUri !== 'undefined') {
        response += valueUri;
    }

    if (typeof valueAttachment !== 'undefined') {
        response += valueAttachment;
    }

    if (typeof valueCoding !== 'undefined') {
        response += valueCoding;
    }

    if (typeof valueQuantity !== 'undefined') {
        response += valueQuantity;
    }
    if (typeof valueCalculation !== 'undefined') {
        response += String(valueCalculation);
    }

    return response;
}

/* Displays a question on the page by taking an object, creating a paragraph element,
styling it bold with a span, and then returning the question paragraph as an object,
verifies whether the last character of the question is a semi-colon, if not one is added */
function renderQuestion(obj, depth) {
    console.log('Depth: %s', depth.toString());
    let { text } = obj;
    let line = document.createElement('p');
    line.style.marginLeft = (depth * 2).toString() + 'em';
    let question = document.createElement('span');
    question.classList.add('question');
    if (text.charAt(text.length - 1) == ':') {
        question.textContent = text + ' ';
    } else if (text.charAt(text.length - 1) == ' ') {
        if (text.charAt(text.length - 2) == ':') {
            question.textContent = text + ' ';
        }
    } else {
        question.textContent = text + ': ';
    }
    line.appendChild(question);

    return line;
}

function renderText(obj, depth) {
    console.log('Depth: %s', depth.toString());
    let { text } = obj;
    let line = document.createElement('p');
    line.style.marginLeft = (depth * 2).toString() + 'em';
    let textblock = document.createElement('span');
    textblock.classList.add('text');
    textblock.textContent = text ;
    
    line.appendChild(textblock);

    return line;
}
/**
 * Takes an item object, displays a header on the page, creating an h1 element,
 * and then returning the header as an object
 * @param {text} object.text
 */
function renderHeader(obj, depth) {
    let { text } = obj;

    if (depth < 1) {
        let line = document.createElement('h1');
        line.textContent = text;
        return line;
    }

    if (depth >= 1) {
        let line = document.createElement('p');
        line.classList.add('subheader');
        line.style.marginLeft = (depth * 2).toString() + 'em';
        line.style.marginRight = '0.4em';
        line.textContent = text;
        return line;
    }
}

/* Displays an answer on the page by taking an object, creating a span element with a
normal style applied, to remove any bolding, and then returns the answer as an object */
function renderAnswer(obj, depth) {
    let answer = document.createElement('span');
    answer.classList.add('answer');
    answer.textContent = getAnswerText(obj)+ ' ';;

    return answer;
}

/* Displays a Multi-line answer on the page by taking an object, creating a span element
with a normal style applied, to remove any bolding, adding a comma at the end, and then
returns the answer as an object */
function renderMultiAnswer(obj) {
    let answer = document.createElement('span');
    answer.textContent = getAnswerText(obj) + ', ';

    return answer;
}
function renderScore(scoreint)
{
    let scoreimg = document.createElement('img');

    if(scoreint > 0) {
        scoreimg.src = 'ok.png';
        scoreimg.width=15;
    }
    else
    {
        scoreimg.src = 'cancel.png';
        scoreimg.width=15;
    }
    return scoreimg;
}
// Remove the previous JSON data from the page so new data can be displayed
function clearJSONResults() {
    while (qrSection.firstChild) {
        qrSection.removeChild(qrSection.firstChild);
    }
}

/**
 * Validate the json payload for errors, if any exist then the payload is unsuccessful
 * and will not be rendered. Any errors will be displayed instead */
function handleErrors() {
    if (errors.length > 0) {
        console.log(errors);
        clearJSONResults();

        if (errors.length > 0) {
            let line = document.createElement('h1');
            line.textContent = errors.length.toString() + ' errors were detected:';
            line.style.color = 'red';
            qrSection.appendChild(line);
        } 

        errors.forEach(e => {
            let line = document.createElement('p');
            line.innerHTML = e;
            line.style.color = 'red';
            let question = document.createElement('span');
            question.classList.add('question');
            line.appendChild(question);
            qrSection.appendChild(line);
        });
        errors = [];
    }
}

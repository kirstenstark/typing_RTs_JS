/* Custom plugin for typed picture naming tasks
*   Author: Kirsten Stark
*   Description: This is a custom plugin that allows to collect RTs of keypresses in
*                 a classic picture naming task with typewritten answers. 
*                 The plugin can be customized by definining fixation cross/stimulus/
*                 trial duration, by allowing corrections or not, and by displaying 
*                 the object name or not.
*/

jsPsych.plugins['typed-picture-naming'] = (function(){

  var plugin = {};

  plugin.info = {
    name: 'typed-picture-naming',
    parameters: {
      fixcross: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'fixation cross', 
        default: 'stims/fix.png',
        pretty_name: 'The fixation cross image'
      },
      stimulus: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'stimulus',
        default: undefined,
        description: 'The image to be displayed'
      },
      stimulus_height: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'image height',
        default: 200,
        description: 'Set the image height in pixels'
      },
      stimulus_width: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'image width',
        default: 200,
        description: 'Set the image width in pixels'
      },
      maintain_aspect_ratio: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Maintain aspect ratio',
        default: true,
        description: 'Maintain the aspect ratio after setting width or height'
      },
      text: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'text',
        default: '',
        description: 'Any content here will be displayed on screen - can be HTML.'
      },
      display_name: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'stimulus name displayed above picture',
        default: false,
        description: 'Should the stimulus name be displayed above the picture?'
      },
      fixcross_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Fixcross duration in ms',
        default: 500,
        description: 'The duration of the fixcross presentation after page was fully loaded'
      },
	    stimulus_duration: {
          type: jsPsych.plugins.parameterType.INT,
          pretty_name: 'Stimulus duration in ms',
          default: '',
          description: 'The duration of the stimulus presentation, if participants did not hit space or enter button before.'
      },
      trial_duration: {
          type: jsPsych.plugins.parameterType.INT,
          pretty_name: 'Trial duration',
          default: 6000,
          description: 'The maximal duration of the entire trial.'
      },
      corrections: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'allowing backspace correction',
        default: true,
        description: 'Boolean value that indicates whether participants should be allowed to backspace correct their typed entries'
      },
      choices: {
        type: jsPsych.plugins.parameterType.KEY,
        array: true,
        pretty_name: 'Choices',
        default: jsPsych.ALL_KEYS,
        description: 'The keys the subject is allowed to press to respond to the stimulus.'
      },
      stim_name: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'stimulus name',
        default: '',
        description: 'Stimulus name that will be saved into the output data'
      },
      stim_number: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'stimulus ID',
        default: '',
        description: 'Stimulus ID that will be saved into the output data'
      }
    }
  }

  plugin.trial = function(display_element, trial){

     // --------- DEFINE DISPLAY ---------//

    // get/set image height and width (adapted from jspsych-image-button-response.js)
    function getHeightWidth() {
      if (trial.maintain_aspect_ratio) {
        if (trial.stimulus_height !== null) {
          height = trial.stimulus_height;
          width = trial.stimulus.naturalWidth * (trial.stimulus_height/trial.stimulus.naturalHeight);
        } else if (trial.stimulus_width !== null && trial.stimulus_height === null) {
          width = trial.stimulus_width;
          height = trial.stimulus.naturalHeight * (trial.stimulus_width/trial.stimulus.naturalWidth);
        } else {
          height = trial.stimulus.naturalHeight;
          width = trial.stimulus.naturalWidth;
        }
      } else {
        height = trial.stimulus_height;
        width = trial.stimulus_width;
      }
      trial.stimulus_height = height;
      trial.stimulus_width = width;
    }
    getHeightWidth(); // call now, in case image loads immediately (is cached)

    // prepare html 
    if(trial.display_name) {
      var html_name = '<br><center><strong><span id="stimulus_name" style= "text-transform:uppercase;margin: 20px;unicode-range: U+1E9E-1E9E;charset=utf-8; visibility: hidden">'+trial.stim_name+'</span></strong></center>';
      var new_html = html_name;
    } else {
      var new_html = '';
    }
    
    // prefetch stimulus
    var html_prefetch = '<center><link rel="prefetch" href="'+trial.stimulus+' "/></center>';
      // display fixcross
    var html_fixcross = '<center><img id="pic" src="'+trial.fixcross+'" width='+trial.stimulus_width+' height='+trial.stimulus_height+'></center>';
      // display textbox underneath picture/fixcross
    var html_textbox = '<tr> <td><center><input id="answer" type="text" style = "text-transform:uppercase;margin: 20px;unicode-range: U+1E9E-1E9E;charset=utf-8"> </center></td></tr>';
   
    new_html += html_prefetch+html_fixcross+html_textbox;

    if (trial.text !== '') {
      // info how to proceed to next field
      var html_text = '<br><center>'+trial.text+'</center><br><br><br>';
      new_html += html_text;
     }

     // draw
    display_element.innerHTML = new_html;

      // --------- ACTUAL TRIAL ---------//

     // initialize output variable
     var output=[];
     var trial_data={};

    //window.onload = function() { // TODO: UNLOAD METHOD DOESN'T SEEM TO WORK WITH PLUGIN, 
                                  //  BUT IMAGES ARE PRELOADED AND PREFETCHED
      // show picture after predefined fixcross duration (default is 500 ms)
      setTimeout(function() {
        start = new Date();
        document.getElementById('pic').setAttribute('src', trial.stimulus);
        // set cursor to text input field
        document.getElementById('answer').focus();
        if (trial.display_name) {
          document.getElementById('stimulus_name').style.visibility="visible";
        }
      }, trial.fixcross_duration, start = 0);

      // if stimulus should be shown shorter than overall trial, this is done here
      if (trial.stimulus_duration !== '') {
        duration = setTimeout(function() {
          document.getElementById('pic').style.visibility="hidden";
        }, trial.stimulus_duration);
      } else {
        duration = setTimeout(function() {
          document.getElementById('pic').style.visibility="hidden";
          //document.getElementById('pic').setAttribute('src', "//:0");
          //document.getElementById('pic').style.display='none';
        }, trial.trial_duration);
      }

      // if no answer is provided, proceed to next page after duration defined
      // in trial_duration (default is 6 sec/6000 ms)
      timeout = setTimeout(function() {
        output.push({'word': input});
        // data saving
        var trial_data = {
          "stimulus": trial.stim_name,
          "stimulus_id": trial.stim_number,
          "rts": output
        };
        // clear any remaining timeouts and variables
        clearTimeout(timeout);
        clearTimeout(duration);
        input = undefined;
        counter= undefined;
        output= undefined;
        start=undefined;
        delete(input, counter, output, start);
        // send data
        jsPsych.finishTrial(trial_data);
        // end trial
        return plugin;
      }, trial.trial_duration);

      // define variables
      var counter = 0;
      var input='';

      // define what happens when a keyboard button is pressed
      document.addEventListener('keydown', function(event) {
        // define input
        var t = new Date()-start; // get rt from the moment when the picture was first displayed

        // disable backspace and delete keys and save input (entire word) if trial.corrections == false
      if (t < trial.trial_duration) {
        if(trial.corrections === false) {
          if(event.key === 'Backspace' || event.key === 'Delete') {
            event.preventDefault();
          }else if ((t) >0) {
            // if corrections == false, 
            // the variable input contains the input the participant is seeing, 
            // thus excluding Backspace and Delete (which do not have an effect here)
            input += event.key;
          }
        } else if ((t) > 0) {
            // if trial.corrections === true, the variable input contains all pressed
            // keys, including backspace and delete. Backspace corrections on the input
            // variable do then need to be applied offline 
            // see e.g. functions provided on: 
            // https://github.com/kirstenstark/stringmatch_typed_naming
            input += event.key;
          }
          // save current key and timing into internal variable
          var letter = event.key;
          if ((t) > 0) {
            output.push([(letter),(t)]);
          }
        // end trial upon backspace or enter key if at least two characters 
        // were previously typed
        if ((event.key === 'Enter' || event.key === ' ') && counter > 1) { //32 is the space bar, 13 is enter
          output.push({'word': (input)});
          // data saving
          trial_data = {
            "stimulus": trial.stim_name,
            "stimulus_id": trial.stim_number,
            "rts": output
          };
          // clear any remaining timeouts and variables
          clearTimeout(timeout);
          clearTimeout(duration);
          input = undefined;
          counter= undefined;
          output= undefined;
          start=undefined;
          delete(input, counter, output, start);
          // send data
          jsPsych.finishTrial(trial_data);
          // end trial
          return plugin;
        } else if (event.key !== 'Enter'  && event.key !== ' '  && event.key !== 'Backspace' && event.key !== 'Delete') {
          // count number of characters already pressed
          counter += 1;
      };
      } else {
        // do nothing upon keypress before picture is presented
        event.preventDefault();
        return false;
      }
    });

    }
  //}
return plugin;
})();

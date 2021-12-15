/* Custom plugin for typed picture naming tasks
*   Author: Kirsten Stark
*   Description: This is a custom plugin that allows to collect RTs of keypresses in
*                 a classic picture naming task with typewritten answers. 
*                 The plugin can be customized by definining fixation cross/stimulus/
*                 trial duration, by allowing corrections or not, and by displaying 
*                 the object name or not.
*/

typed_picture_naming = (function(
  fixcross = 'Pictures/fix.png',  // The fixation cross image
  stimulus = '',                  // The image to be displayed
  stimulus_height = 200,          // Set the image height in pixels
  stimulus_width = 200,           // Set the image width in pixels
  maintain_aspect_ratio = true,   // Maintain the aspect ratio after setting width or height?
  text = '',                      // Any content here will be displayed on screen below the text box  - can be HTML
  display_name = false,           // Should the stimulus name be displayed above the picture?
  fixcross_duration = 500,        // The duration of the fixcross presentation in ms after page was fully loaded
  stimulus_duration = 6000,       // The duration of the stimulus presentation in ms, if participants did not hit space or enter button before
  trial_duration = 6000,          // The maximal duration in ms
  corrections = true,              // Boolean value that indicates whether participants should be allowed to backspace correct their typed entries
  stim_name = '',                 // Stimulus name that will be saved into the output data
  stim_number = ''                    // Stimulus ID that will be saved into the output data
){

   // --------- PREPARE DISPLAY ---------//
    // get/set image height and width (adapted from jspsych-image-button-response.js)
    function getHeightWidth() {
      if (maintain_aspect_ratio) {
        if (stimulus_height !== null) {
          height = stimulus_height;
          width = stimulus.naturalWidth * (stimulus_height/stimulus.naturalHeight);
        } else if (stimulus_width !== null && stimulus_height === null) {
          width = stimulus_width;
          height = stimulus.naturalHeight * (stimulus_width/stimulus.naturalWidth);
        } else {
          height = stimulus.naturalHeight;
          width = stimulus.naturalWidth;
        }
      } else {
        height = stimulus_height;
        width = stimulus_width;
      }
      stimulus_height = height;
      stimulus_width = width;
    }
    getHeightWidth();

    // prepare html 
    if(display_name) {
      var html_name = '<br><center><strong><span id="stimulus_name" style= "text-transform:uppercase;margin: 20px;unicode-range: U+1E9E-1E9E;charset=utf-8; visibility: hidden">'+stim_name+'</span></strong></center>';
      var new_html = html_name;
    } else {
      var new_html = '';
    }
    
    // prefetch stimulus
    var html_prefetch = '<center><link rel="prefetch" href="'+stimulus+' "/></center>';
      // display fixcross
    var html_fixcross = '<center><img id="pic" src="'+fixcross+'" width='+stimulus_width+' height='+stimulus_height+'></center>';
      // display textbox underneath picture/fixcross
    var html_textbox = '<tr> <td><center><input id="answer" type="text" style = "text-transform:uppercase;margin: 20px;unicode-range: U+1E9E-1E9E;charset=utf-8"> </center></td></tr>';
   
    new_html += html_prefetch+html_fixcross+html_textbox;

    if (text !== '') {
      // info how to proceed to next field
      var html_text = '<br><center>'+text+'</center><br><br><br>';
      new_html += html_text;
     }

     // draw
    document.write(new_html);

      // --------- ACTUAL TRIAL ---------//

     // initialize output variable
     var output=[];
     var trial_data={};

    //window.onload = function() { // TODO: UNLOAD METHOD DOESN'T SEEM TO WORK WITH PLUGIN, 
                                  //  BUT IMAGES ARE PRELOADED AND PREFETCHED
      // show picture after predefined fixcross duration (default is 500 ms)
      setTimeout(function() {
        start = new Date();
        document.getElementById('pic').setAttribute('src', stimulus);
        // set cursor to text input field
        document.getElementById('answer').focus();
        if (display_name) {
          document.getElementById('stimulus_name').style.visibility="visible";
        }
      }, fixcross_duration, start = 0);

      // if stimulus should be shown shorter than overall trial, this is done here
      if (stimulus_duration !== '') {
        duration = setTimeout(function() {
          document.getElementById('pic').style.visibility="hidden";
        }, stimulus_duration);
      } else {
        duration = setTimeout(function() {
          document.getElementById('pic').style.visibility="hidden";
          //document.getElementById('pic').setAttribute('src', "//:0");
          //document.getElementById('pic').style.display='none';
        }, trial_duration);
      }

      // if no answer is provided, proceed to next page after duration defined
      // in trial_duration (default is 6 sec/6000 ms)
      timeout = setTimeout(function() {
        output.push({'word': input});
        // data saving
        var trial_data = {
          "stimulus": stim_name,
          "stimulus_id": stim_number,
          "rts": output
        };
        // clear any remaining timeouts and variables
        document.getElementById('pic').style.display="hidden";
        clearTimeout(timeout);
        clearTimeout(duration);
        input = undefined;
        counter= undefined;
        output= undefined;
        start=undefined;
        delete(input, counter, output, start);

        // end trial
        return trial_data;
      }, trial_duration);

      // define variables
      var counter = 0;
      var input='';

      // define what happens when a keyboard button is pressed
      document.addEventListener('keydown', function(event) {
        // define input
        var t = new Date()-start; // get rt from the moment when the picture was first displayed

        // disable backspace and delete keys and save input (entire word) if trial.corrections == false
      if (t < trial_duration) {
        if(corrections === false) {
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
            "stimulus": stim_name,
            "stimulus_id": stim_number,
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

          // end trial
          return trial_data;
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

return trial_data;
});

/* eslint-disable */
const details = () => {
  return {
    id: "BillyInferno_Handbrake_Encoding",
    Stage: "Pre-processing",
    Name:
      "Configurable Handbrake Video Encoding",
    Type: "Video",
    Operation: 'Transcode',
    Description: 'Configurable video encoding with lot of options using Handbrake',
    Version: "2.00",
    Tags: "pre-processing,handbrake,ffmpeg,configurable",
    Inputs:[
      {
        name: "max_video_width",
        tooltip: `
        \\nMaximum video width that will be used as based for encoding.\\n
        \\nValue:\\n
        1920\\n
        2160\\n
        \\nDefault:\\n
        1920`,
      },
      {
        name: "auto_crop",
        type: 'boolean',
        defaultValue: false,
        inputUI: {
          type: 'dropdown',
          options: [
            'false',
            'true',
          ],
        },
        tooltip: `
        \\nEnter value whether Handbrake need to auto crop the black bar or not.\\n
        \\nValue:\\n
        true\\n
        false\\n
        \\nDefault:\\n
        false`,
      },
      {
        name: "use_crf",
        type: 'boolean',
        defaultValue: true,
        inputUI: {
          type: 'dropdown',
          options: [
            'false',
            'true',
          ],
        },
        tooltip: `
        \\nWhether to encode using CRF or VBR (with 2-pass).\\n
        \\nValue:\\n
        true\\n
        false\\n
        \\nDefault:\\n
        true`,
      },
      {
        name: "crf_quality",
        tooltip: `
        \\nSet video quality (float value).\\n
        \\nValue:\\n
        23.0\\n
        25.5\\n
        \\nDefault:\\n
        23.0`,
      },
      {
        name: "video_bitrate",
        tooltip: `
        \\nSet video birate (>= 1000).\\n
        \\nValue:\\n
        2500\\n
        3000\\n
        \\nDefault:\\n
        2500`,
      },
      {
        name: "audio_bitrate",
        tooltip: `
        \\nSet audio birate (32 - 512).\\n
        \\nValue:\\n
        32\\n
        160\\n
        \\nDefault:\\n
        160`,
      },
      {
        name: "extract_subs",
        type: 'boolean',
        defaultValue: true,
        inputUI: {
          type: 'dropdown',
          options: [
            'false',
            'true',
          ],
        },
        tooltip: `
        \\nExtract subtitle if exists.\\n
        \\nValue:\\n
        true\\n
        false\\n
        \\nDefault:\\n
        true`,
      },
      {
        name: "encoder_preset",
        tooltip: `
        \\nAdjust video encoding settings for a particular speed/efficiency tradeoff (encoder-specific).\\n
        \\nValue:\\n
        ultrafast\\n
        superfast\\n
        veryfast\\n
        faster\\n
        fast\\n
        medium\\n
        slow\\n
        slower\\n
        veryslow\\n
        placebo\\n
        \\nDefault:\\n
        medium`,
      },
      {
        name: "encoder_tune",
        tooltip: `
        \\nAdjust video encoding settings for a particular type of source or situation (encoder-specific).\\n
        \\nValue:\\n
        film\\n
        animation\\n
        grain\\n
        stillimage\\n
        psnr\\n
        ssim\\n
        fastdecode\\n
        zerolatency\\n
        \\nDefault:\\n
        film`,
      },
      {
        name: "encoder_level",
        tooltip: `
        \\nEnsures compliance with the requested codec level (encoder-specific).\\n
        \\nValue:\\n
        auto\\n
        1.0\\n
        1b\\n
        1.1\\n
        1.2\\n
        1.3\\n
        2.0\\n
        2.1\\n
        2.2\\n
        3.0\\n
        3.1\\n
        3.2\\n
        4.0\\n
        4.1\\n
        4.2\\n
        5.0\\n
        5.1\\n
        5.2\\n
        \\nDefault:\\n
        4.2`,
      },
      {
        name: "encoder_profile",
        tooltip: `
        \\nEnsures compliance with the requested codec profile (encoder-specific).\\n
        \\nValue:\\n
        auto\\n
        high\\n
        main\\n
        baseline\\n
        \\nDefault:\\n
        high`,
      },
      {
        name: "is_debug",
        type: 'boolean',
        defaultValue: true,
        inputUI: {
          type: 'dropdown',
          options: [
            'false',
            'true',
          ],
        },
        tooltip: `
        \\nTo pass the parameter to the console log or not?\\n
        \\nValue:\\n
        true\\n
        false\\n
        \\nDefault:\\n
        false`,
      },
    ],
  };
}

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);

  // check if debug or not?
  if (inputs.is_debug) {  
    console.log("FILE:");
    console.log(file);
    console.log('\n\n');
    console.log("INPUTS:");
    console.log(inputs);
    console.log('\n\n');
    console.log("LIBRARY SETTINGS");
    console.log(librarySettings);
    console.log('\n\n');
    console.log("OTHER ARGUMENTS");
    console.log(otherArguments);
  }

  // must return this object
  var response = {
    processFile: false,
    preset: "",
    container: ".mp4",
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: "",
  };

  // helper variable
  var inpHelper = '';
  var hasSubs = false;
  var audioBitRate = 0;
  var audioFound = false;
  var audioNum = 0;
  var handBrakeCLI = "";
  var autoCrop = inputs.auto_crop;
  var useCrf = inputs.use_crf;
  var extractSubs = inputs.extract_subs;
  var videoWidth = 0;
  var videoHeight = 0;
  var frameRates = 30;
  var frameKeyInt = 15;
  var frameMinKeyInt = 8;
  var frameRef = 4;
  var CRFQuality = 23.0;
  var maxVideoWidth = 1920;
  var vbr = 2500;
  var abr = 160;
  var encoderPreset = "medium";
  var encoderTune = "film";
  var encoderLevel = "4.2";
  var encoderProfile = "high";
  var averageBitRate = undefined;

  // Ensure all the configuration is available, if not we will defaulted the value
  if (!(inputs.max_video_width === undefined)) {
    // parse the crf quality into float
    inpHelper = parseInt(inputs.max_video_width);
    if(!(isNaN(inpHelper))) {
      // correct value, check whether value is correct
      if(inpHelper > 0) {
        maxVideoWidth = inpHelper;
      }
    }
    else {
      response.infoLog += "⚠ Invalid value for Max Video Width, defaulted to 1920\n";
    }
  }
  if (!(inputs.video_bitrate === undefined)) {
    // parse the video bitrate
    inpHelper = parseInt(inputs.video_bitrate);
    if(!(isNaN(inpHelper))) {
      // correct value, check whether value is correct
      if(inpHelper >= 1000) {
          vbr = inpHelper;
      }
    }
    else {
      response.infoLog += "⚠ Invalid value for Video Bitrate, defaulted to 2500\n";
    }
  }
  if (!(inputs.audio_bitrate === undefined)) {
    // parse the video bitrate
    inpHelper = parseInt(inputs.audio_bitrate);
    if(!(isNaN(inpHelper))) {
      // correct value, check whether value is correct
      if(inpHelper >= 32 && inpHelper <= 512) {
          abr = inpHelper;
      }
    }
    else {
      response.infoLog += "⚠ Invalid value for Audio Bitrate, defaulted to 160\n";
    }
  }
  if (!(inputs.crf_quality === undefined)) {
    // parse the crf quality into float
    inpHelper = parseFloat(inputs.crf_quality);
    if(!(isNaN(inpHelper))) {
      // correct value, check whether value is correct
      if(inpHelper >= 0.0 && inpHelper <= 51.0) {
          CRFQuality = inpHelper;
      }
    }
    else {
      response.infoLog += "⚠ Invalid value for CRF Quality, defaulted to 23.0\n";
    }
  }
  if (!(inputs.encoder_preset === undefined)) {
    inpHelper = inputs.encoder_preset.toLowerCase();
    
    // ensure that this is as per list
    switch(inpHelper) {
      case "ultrafast":
      case "superfast":
      case "veryfast":
      case "faster":
      case "fast":
      case "medium":
      case "slow":
      case "slower":
      case "veryslow":
      case "placebo":
        encoderPreset = inpHelper;
        break;
      default:
        encoderPreset = "medium";
        response.infoLog += "⚠ Invalid value for Encoder Preset, defaulted to medium\n";
        break;
    }
  }
  if (!(inputs.encoder_tune === undefined)) {
    inpHelper = inputs.encoder_tune.toLowerCase();
    // ensure that this is as per list
    switch(inpHelper) {
      case "film":
      case "animation":
      case "grain":
      case "stillimage":
      case "psnr":
      case "ssim":
      case "fastdecode":
      case "zerolatency":
        encoderTune = inpHelper;
        break;
      default:
        encoderTune = "film";
        response.infoLog += "⚠ Invalid value for Encoder Tune, defaulted to film\n";
        break;
    }
  }
  if (!(inputs.encoder_level === undefined)) {
    inpHelper = inputs.encoder_level.toLowerCase();
    // ensure that this is as per list
    switch(inpHelper) {
      case "auto":
      case "1.0":
      case "1b":
      case "1.1":
      case "1.2":
      case "1.3":
      case "2.0":
      case "2.1":
      case "2.2":
      case "3.0":
      case "3.1":
      case "3.2":
      case "4.0":
      case "4.1":
      case "4.2":
      case "5.0":
      case "5.1":
      case "5.2":
        encoderLevel = inpHelper;
        break;
      default:
        encoderLevel = "4.2";
        response.infoLog += "⚠ Invalid value for Encoder Level, defaulted to 4.2\n";
        break;
    }
  }
  if (!(inputs.encoder_profile === undefined)) {
    inpHelper = inputs.encoder_profile.toLowerCase();
    switch(inpHelper) {
      case "auto":
      case "high":
      case "main":
      case "baseline":
        encoderProfile = inpHelper;
        break;
      default:
        encoderProfile = "high";
        response.infoLog += "⚠ Invalid value for Encoder Profile, defaulted to high\n";
        break;
    }
  }

  // --- CHECK FOR IF ALREADY PERFORM BEFORE OR NOT ---
  // since average bit rate sometimes in AvgBitrate, some file in AverageBitrate
  // first check, which one is being used?
  if (file.meta.AvgBitrate !== undefined) {
    // user AvgBitrate
    averageBitRate = file.meta.AvgBitrate;
    response.infoLog += "🔎 Get average bitrate from AvgBitrate!\n";
    response.infoLog += `🔎 Current average bitrate ${averageBitRate}\n`;
  }
  else {
    // try to check on AverageBitrate
    if (file.meta.AverageBitrate !== undefined) {
      averageBitRate = file.meta.AverageBitrate;
      response.infoLog += "🔎 Get average bitrate from AverageBitrate!\n";
      response.infoLog += `🔎 Current average bitrate ${averageBitRate}\n`;
    }
    else {
      if (file.meta.MaxBitrate !== undefined) {
        averageBitRate = file.meta.MaxBitrate;
        response.infoLog += "🔎 Get average bitrate from MaxBitrate!\n";
        response.infoLog += `🔎 Current average bitrate ${averageBitRate}\n`;
      }
      else {      
        response.infoLog += "❌ Unable to find average bitrate information!\n";
        averageBitRate = undefined;
      }
    }
  }

  // now check if user use CRF or not?
  // if not using CRF we can check if the averageBitRate already matched
  // with the target given on the input.
  if (!useCrf) {
    if (averageBitRate !== undefined) {
      averageBitRate = averageBitRate / 1000;
      // assume we add another 100kbps just to give ceiling
      // since we want to ensure the current average bit rate
      // is smaller than vbr
      if (averageBitRate >= (vbr + 100)) {
        response.infoLog += `⚠️ Current video bit rate ${averageBitRate} is more than ${vbr}!\n`;
        response.infoLog += `⚠️ Set average bitrate to undefined\n`;
        averageBitRate = undefined;
      }
      else {
        response.infoLog += `✅ Current video bit rate ${averageBitRate} already below ${vbr}!\n`;
      }
    }
    else {
      response.infoLog += `❌ Unable to find the average bit rate information`;
    }
  }
  else {
    // this is using CRF, so we will assume that the average bit rate will be 1
    // to avoid any issue on the check below
    response.infoLog += `❗ Compressed using CRF\n`;
    averageBitRate = 1;
  }

  // check if this already being compressed?
  // if so, then just return the response to continue to next plugin process
  response.infoLog += `🎞️ Current container is ${file.container}\n`;
  if (!useCrf) {
    response.infoLog += `✨ Current average bitrate is ${averageBitRate}\n`;
  }
  response.infoLog += `🅿️ Current encoder is ${file.meta.Encoder}\n`;
  if ( file.container == 'mp4' &&
       averageBitRate !== undefined &&
       file.meta.Encoder !== undefined ) {
    if (file.meta.Encoder.toLowerCase().indexOf('handbrake') >= 0) {    
      response.infoLog += "✅ Already compressed, skip!\n";
      return response;
    }
    else {
      response.infoLog += "❌ Not yet compressed using HandBrake!\n";
    }
  }
  else {
    response.infoLog += "❌ Not yet compressed!\n";
  }
  // --- CHECK FOR IF ALREADY PERFORM BEFORE OR NOT ---


  if (file.fileMedium !== "video") {
    if (inputs.is_debug) {
      console.log("File is not video");
    }

    response.infoLog += "🎞️ File is not video \n";
    response.processFile = false;

    return response;
  } else {
    var jsonString = JSON.stringify(file);

    var hasSubs = false;

    for (var i = 0; i < file.ffProbeData.streams.length; i++) {
      try {
        // check if got subtitle or not?
        if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle") {
          hasSubs = true;
        }

        // check for the audio bitrate
        if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
          // add the number of audio on the file (this is in case we have 2 audio)
          audioNum = audioNum + 1;
          // check if current audio bitrate is bigger
          // ensure that bit_rate is not NaN
          if (!(isNaN(file.ffProbeData.streams[i].bit_rate))) {
            // tell them we found audio that we knew, otherwise, just blantantly copy, since encoding Audio
            // is not that hard?
            if (file.ffProbeData.streams[i].bit_rate > audioBitRate) {
                audioBitRate = file.ffProbeData.streams[i].bit_rate;
            }
            audioFound = true;
          }
        }

        // get the width and height of the video, we will keep the width and height
        // of the video converted (no crop).
        if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "video") {
            // for video to be exists, it should have frame frame.
            // so ensure that this stream got framerates to avoid that we get the dimension of other stream
            // that also registered as video (such as cover)
            frameRates = file.ffProbeData.streams[i].avg_frame_rate;

            if (inputs.is_debug) {
              console.log("Video Frame Rates : " + frameRates);
            }

            // compute the keyint for the frame
            frameRates = eval(frameRates);

            if (!(isNaN(frameRates))) {
                // ensure the frame rates is more than 0
                if(frameRates > 0) {
                    // we can assume that this is video, get the dimension, and calculate the frame key int.
                    videoWidth = file.ffProbeData.streams[i].width;
                    videoHeight = file.ffProbeData.streams[i].height;

                    if (inputs.is_debug) {                    
                      console.log("Video Width : " + videoWidth);
                      console.log("Video Height : " + videoHeight);
                    }

                    var vw = eval(videoWidth);
                    var vh = eval(videoHeight);

                    // check if the videoWidth is more than maxVideoWidth (if more then we need to resize it)
                    if(vw > maxVideoWidth) {
                        if (inputs.is_debug) {
                          console.log("Video is more than "+ maxVideoWidth +", resize the video");
                        }

                        var newVideoHeight = 0;
                        // get the aspect ratio for the height
                        newVideoHeight = parseInt((maxVideoWidth/vw)*vh);

                        if (inputs.is_debug) {
                          console.log("Resize Video to "+ maxVideoWidth +" x " + newVideoHeight);
                        }

                        // set the new video height
                        videoWidth = maxVideoWidth;
                        videoHeight = newVideoHeight;
                    }

                    frameKeyInt = parseInt(frameRates/2);
                    frameMinKeyInt = parseInt(frameKeyInt/2);
                }
                else {
                  if (inputs.is_debug) {
                    console.log("Framerates of stream " + i + " is 0");
                  }
                }
            }
            else {
              if (inputs.is_debug) {
                console.log("Cannot found the Framerates of stream " + i);
              }
            }
        }
      } catch (err) {
        if (inputs.is_debug) {
          console.log("Error during Probing: " + err);
        }
        response.infoLog += "⚠️ Error during probing (see console if debug enabled)\n";
      }
    }

    ///

    // now let's try to generate Handbrake CLI command to convert this
    // 1. set the preset that we will used, in this case we will used Vimeo/Youtube 1080p
    handBrakeCLI += '-Z "Creator 1080p60" ';
    
    // 2. set the video configuration
    if(useCrf) {
        handBrakeCLI += '--encoder "x264" --encoder-preset "'+encoderPreset+'" --encoder-tune "'+encoderTune+'" --encopts "keyint='+frameKeyInt+':min-keyint='+frameMinKeyInt+':ref='+frameRef+':bframes=2:b-pyramid=none" --encoder-level "'+encoderLevel+'" --encoder-profile "'+encoderProfile+'" --quality '+CRFQuality+' --vfr '
    }
    else
    {
        handBrakeCLI += '--encoder "x264" --encoder-preset "'+encoderPreset+'" --encoder-tune "'+encoderTune+'" --encopts "keyint='+frameKeyInt+':min-keyint='+frameMinKeyInt+':ref='+frameRef+':bframes=2:b-pyramid=none" --encoder-level "'+encoderLevel+'" --encoder-profile "'+encoderProfile+'" --vb '+vbr+' --two-pass --vfr ';
    }

    // 3. check whether got subs or not, and whether we need to extract or not?
    if(hasSubs && extractSubs) {
        handBrakeCLI += '--all-subtitles ';
    }
    
    // 4. for Audio we have several condition
    //    - if audio > 1 then just copy all the audio
    //    - if audio only 1 but cannot find the bit rate info, then just copy all the audio
    //    - if audio only 1 and we can see the bit rate, then convert to stereo - 160kbps
    if (audioNum > 1) {
        handBrakeCLI += '--all-audio ';
    }
    else {
        // only 1, check if we can find bit rate or not?
        if(audioFound) {
            handBrakeCLI += '--all-audio --aencoder "av_aac" --mixdown "stereo" ';
            // if(audioBitRate > 160000) {
            if(audioBitRate > (abr * 1000)) {
                handBrakeCLI += '--ab ' + abr + ' ';
            }
        }
        else {
            handBrakeCLI += '--all-audio ';
        }
    }
    
    // 5. optional
    // check if we don't want to crop?
    if(!(autoCrop)) {
        handBrakeCLI += '--width '+videoWidth+' --height '+videoHeight+' --crop 0:0:0:0 '
    }
    
    // finalize as this is for web and make it no marker
    handBrakeCLI += '--no-markers --optimize --format "av_mp4"';

    if (inputs.is_debug) {
      console.log("Perform this: " + handBrakeCLI);
    }

    // set appropriate response
    response.processFile = true;
    response.handBrakeMode = true;
    response.infoLog += "⏳ Compress Video for Jellyfin\n";
    response.preset = handBrakeCLI;

    return response;
  }
}

module.exports.details = details;
module.exports.plugin = plugin;

/**
    [DllImport("__Internal")]
    public static extern void Initialize(string mode,string applicationName);

    [DllImport("__Internal")]
    public static extern void MicroPhonePremission();

    [DllImport("__Internal")]
    public static extern bool IsMicroPhonePremission();

    [DllImport("__Internal")]
    public static extern void StartRecording();

    [DllImport("__Internal")]
    public static extern bool IsStartRecording();

    [DllImport("__Internal")]
    public static extern void StopRecording();

    [DllImport("__Internal")]
    public static extern bool IsVoiceStopped();

    [DllImport("__Internal")]
    public static extern bool IsVoiceSaved();

    [DllImport("__Internal")]
    public static extern void PlaySavedVoice();

    [DllImport("__Internal")]
    public static extern void PauseSavedVoice();

    [DllImport("__Internal")]
    public static extern void ResumeSavedVoice();

    [DllImport("__Internal")]
    public static extern void SelectVideoFile();

    [DllImport("__Internal")]
    public static extern bool IsVideoExists();

    [DllImport("__Internal")]
    public static extern string getVideoInfoVideoName();

    [DllImport("__Internal")]
    public static extern string getVideoInfoVideoSize();

    [DllImport("__Internal")]
    public static extern void Submit(string userId,int questionIndex,string text);

    [DllImport("__Internal")]
    public static extern string getProgress();

    // Available Options(by order or - default is: disable - finished is: done): [disable,text,text_failed,voice_prepare,voice,voice_failed,video_prepare,video,video_failed,done]
    [DllImport("__Internal")]
    public static extern string getProgressMode();

    [DllImport("__Internal")]
    public static extern void ClearAudioCache();

    [DllImport("__Internal")]
    public static extern void ClearVideoCache();

    // For Moving to the Next Question
    [DllImport("__Internal")]
    public static extern void ClearCache();
 */
mergeInto(LibraryManager.library, {
  Initialize: function (mode, applicationName) {
    const theMode = UTF8ToString(mode);
    const theApplicationName = UTF8ToString(applicationName);

    switch (theMode) {
      case "localhost":
        this.baseUrl = "http://localhost:3000/api";
        break;
      case "ip":
        this.baseUrl = "http://192.168.0.184:3000/api";
        break;
      case "production":
        this.baseUrl = "/api";
        break;
      default:
        this.baseUrl = "/api";
        break;
    }

    switch (theApplicationName) {
      case "karma":
        this.baseUrl = this.baseUrl + "/karma";
        break;
      case "sazgar":
        this.baseUrl = this.baseUrl + "/sazgar";
        break;
      case "aryan":
        this.baseUrl = this.baseUrl + "/aryan";
        break;
      default:
        this.baseUrl = this.baseUrl + "/karma";
        break;
    }

    window.addEventListener("beforeunload", (event) => {
      // Cancel the event as needed
      event.preventDefault();
      event.returnValue = "";
    });
  },

  /**
   * @returns {Promise<void>}
   */
  MicroPhonePremission: async function () {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
    } catch (err) {
      console.error(`you got an error: ${err}`);
    }
  },

  /**
   * @returns {boolean}
   */
  IsMicroPhonePremission: function () {
    if (this.stream) {
      return true;
    } else {
      return false;
    }
  },

  StartRecording: function () {
    console.log("StartRecording " + this.audioContext);
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        this.stream = stream;
        this.mediaRecorder = new MediaRecorder(this.stream);
        this.mediaRecorder.ondataavailable = (event) => {
          if (!this.audioChunks) {
            this.audioChunks = [];
          }

          this.audioChunks.push(event.data);
        };
        this.mediaRecorder.start();
        console.log("accessing microphone: ");
      })
      .catch((error) => {
        console.error("Error accessing microphone: ", error);
      });
  },

  /**
   * @returns {boolean}
   */
  IsStartRecording: function () {
    if (this.stream.getAudioTracks().length > 0) {
      return true;
    } else {
      return false;
    }
  },

  StopRecording: function () {
    this.stream.getAudioTracks().forEach((track) => {
      track.stop();
    });
    this.mediaRecorder.stop();
    this.mediaRecorder.onstop = () => {
      console.log("Stop recording by microphone: ");
      // You can also send the audioBlob to a server here.
      var audioBlob = new Blob(this.audioChunks, {
        type: "audio/ogg; codecs=opus",
      });
      this.audioUrl = URL.createObjectURL(audioBlob);
      this.isVoiceStopped = true;
    };
  },

  IsVoiceStopped: function () {
    if (this.isVoiceStopped === null || this.isVoiceStopped === undefined) {
      return false;
    }
    return this.isVoiceStopped;
  },

  /**
   * @returns {boolean}
   */
  IsVoiceSaved: function () {
    if (this.audioChunks) {
      return true;
    } else {
      return false;
    }
  },

  /**
   * @returns {void}
   */
  PlaySavedVoice: function () {
    console.log({ audioUrl: this.audioUrl });
    this.audio = new Audio(this.audioUrl);
    this.audio.controls = true;
    this.audio.play();
  },

  PauseSavedVoice: function () {
    if (this.audio) {
      this.audio.pause();
    }
  },

  ResumeSavedVoice: function () {
    if (this.audio && this.audio.paused) {
      this.audio.play();
    }
  },

  /**
   * @returns {void}
   */
  SelectVideoFile: async function () {
    if (!window.showOpenFilePicker) {
      window.alert("این قابلیت در این مرورگر پشتیبانی نمی شود");
    } else {
      /**
       * @type {FileSystemFileHandle}
       */
      const fileHandles = await window.showOpenFilePicker({
        multiple: false,
        excludeAcceptAllOption: true,
        types: [
          {
            description: "Videos/ویدئو",
            accept: { "video/*": [".mp4", ".mkv", ".avi", ".mov"] },
          },
        ],
      });

      this.videoFileName = fileHandles[0].name;
      /**
       * @type {File}
       */
      this.videoFile = await fileHandles[0].getFile();
    }
  },

  /**
   * @returns {boolean}
   */
  IsVideoExists: function () {
    if (this.videoFileName) {
      return true;
    } else {
      return false;
    }
  },

  /**
   * @returns {string}
   */
  getVideoInfoVideoName: function () {
    //Allocate memory space
    var buffer = _malloc(lengthBytesUTF8(this.videoFileName) + 1);
    //Copy old data to the new one then return it
    writeStringToMemory(this.videoFileName, buffer);
    return buffer;
  },

  /**
   * @returns {string}
   */
  getVideoInfoVideoSize: function () {
    var buffer = _malloc(lengthBytesUTF8(String(this.videoFile.size)) + 1);

    writeStringToMemory(String(this.videoFile.size), buffer);

    return buffer;
  },

  /**
   * @returns {void}
   */
  Submit: async function (userId, questionIndex, text) {
    const theUserId = UTF8ToString(userId);
    const theText = UTF8ToString(text);

    this.progress = 0;
    this.progressMode = "disable";

    if (
      theText &&
      (this.isTextSent === undefined ||
        this.isTextSent === null ||
        !this.isTextSent)
    ) {
      console.log("Sending Text");
      const body = {};

      this.progressMode = "text";
      this.progress = 10;
      body.userId = theUserId;
      body.questionIndex = questionIndex;
      body.text = theText;

      console.log({ reqUrl: this.baseUrl + "/manager", body });

      try {
        const response = await fetch(this.baseUrl + "/manager", {
          signal: AbortSignal.timeout(300000),
          method: "POST",
          mode: "cors",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "connect-src": "self",
          },
          body: JSON.stringify(body),
        });

        console.log("Text sent to server");

        this.isTextSent = response.ok;

        const data = await response.json();
        console.log("Response: ", JSON.stringify(data));
        this.progress = 100;
      } catch (e) {
        this.progressMode = "text_failed";
        console.error("Error sending text to server: ", error);
        this.isTextSent = false;
        return;
      }
    } else {
      this.isTextSent = true;
    }

    if (
      this.audioChunks &&
      this.audioChunks !== undefined &&
      (this.isVoiceSent === undefined ||
        this.isVoiceSent === null ||
        !this.isVoiceSent)
    ) {
      this.progressMode = "voice_prepare";
      var audioBlob = new Blob(this.audioChunks, {
        type: "audio/wav",
      });
      const arrayBuffer = await new Response(audioBlob).arrayBuffer();

      const voiceArray = new Uint8Array(arrayBuffer);

      this.progressMode = "voice";
      this.progress = 0;
      for (let i = 0; i < voiceArray.length; i += 102400) {
        this.progress = Math.floor((i / voiceArray.length) * 100);
        console.log({ progress: this.progress });
        const chunk = voiceArray.slice(i, i + 102400);
        try {
          await fetch(
            this.baseUrl + "/voice/upload/" + theUserId + "/" + questionIndex,
            {
              signal: AbortSignal.timeout(900000),
              method: "POST",
              mode: "cors",
              credentials: "same-origin",
              headers: {
                "Content-Type": "application/octet-stream",
              },
              body: chunk,
            }
          );
        } catch (e) {
          this.progressMode = "voice_failed";
          console.error("Error sending voice Chunks to server: ", error);
          this.isVoiceSent = false;
          break;
        }
      }
      if (this.progressMode === "voice_failed") {
        return;
      }

      const body = {};
      body.userId = theUserId;
      body.questionIndex = questionIndex;
      console.log({ body });

      try {
        const response = await fetch(this.baseUrl + "/voice/submit", {
          signal: AbortSignal.timeout(900000),
          method: "POST",
          mode: "cors",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "connect-src": "self",
          },
          body: JSON.stringify(body),
        }).catch((error) => {
          console.error("Error sending voice to server: " + error);
          this.isVoiceSent = true;
        });

        console.log("voice Sent to the Server");

        this.isVoiceSent = response.ok;
        const data = await response.json();
        console.log("Response: ", JSON.stringify(data));
        this.progress = 100;
      } catch (error) {
        this.progressMode = "voice_failed";
        console.error("Error sending voice to server: ", error);
        this.isVoiceSent = false;
        return;
      }
    } else {
      this.isVoiceSent = true;
    }

    if (
      this.videoFile &&
      this.videoFileName &&
      (this.isVideoSent === undefined ||
        this.isVideoSent === null ||
        !this.isVideoSent)
    ) {
      this.progressMode = "video_prepare";
      // Convert Blob to ArrayBuffer
      const arrayBuffer = await new Response(this.videoFile).arrayBuffer();

      // Convert ArrayBuffer to Uint8Array (if needed)
      const videoArray = new Uint8Array(arrayBuffer);

      this.progressMode = "video";
      this.progress = 0;
      for (let i = 0; i < videoArray.length; i += 102400) {
        this.progress = Math.floor((i / videoArray.length) * 100);
        console.log({ progress: this.progress });
        const chunk = videoArray.slice(i, i + 102400);
        try {
          await fetch(
            this.baseUrl + "/video/upload/" + theUserId + "/" + questionIndex,
            {
              signal: AbortSignal.timeout(900000),
              method: "POST",
              mode: "cors",
              credentials: "same-origin",
              headers: {
                "Content-Type": "application/octet-stream",
              },
              body: chunk,
            }
          );
        } catch (e) {
          this.progressMode = "video_failed";
          console.error("Error sending video Chunks to server: ", error);
          this.isVideoSent = false;
          break;
        }
      }
      if (this.progressMode === "video_failed") {
        return;
      }

      const body = {};
      body.userId = theUserId;
      body.questionIndex = questionIndex;
      body.fileType = String(this.videoFileName).split(".").pop();
      console.log({ body });

      try {
        const response = await fetch(this.baseUrl + "/video/submit", {
          signal: AbortSignal.timeout(900000),
          method: "POST",
          mode: "cors",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "connect-src": "self",
          },
          body: JSON.stringify(body),
        }).catch((error) => {
          console.error("Error sending video to server: " + error);
          this.isVideoSent = true;
        });

        console.log("video Sent to the Server");

        this.isVideoSent = response.ok;
        const data = await response.json();
        console.log("Response: ", JSON.stringify(data));
        this.progress = 100;
      } catch (error) {
        this.progressMode = "video_failed";
        console.error("Error sending video to server: ", error);
        this.isVideoSent = false;
        return;
      }
    } else {
      this.isVideoSent = true;
    }

    if (this.isTextSent && this.isVoiceSent && this.isVideoSent) {
      this.progress = 100;
      this.progressMode = "done";
    }
  },

  /**
   * @returns {number}
   */
  getProgress: function () {
    if (this.progress === null || this.progress === undefined) {
      return 0;
    }

    var buffer = _malloc(lengthBytesUTF8(String(progress)) + 1);
    writeStringToMemory(String(progress), buffer);
    return buffer;
  },

  /**
   * @returns {string}
   */
  getProgressMode: function () {
    let progressMode = this.progressMode;
    if (progressMode === null || progressMode === undefined) {
      progressMode = "disable";
    }

    var buffer = _malloc(lengthBytesUTF8(String(progressMode)) + 1);
    writeStringToMemory(String(progressMode), buffer);
    return buffer;
  },

  /**
   * @returns {void}
   */
  ClearAudioCache: function () {
    this.recorder = null;
    this.mediaRecorder = null;
    this.audioContext = null;
    this.audioChunks = null;
    this.audio = null;
    this.stream = null;
    this.isVoiceSent = null;
    this.isVoiceStopped = null;
  },

  /**
   * @returns {void}
   */
  ClearVideoCache: function () {
    this.videoFile = null;
    this.videoFileName = null;
    this.isVideoSent = null;
  },

  /**
   * @returns {void}
   */
  ClearCache: function () {
    this.recorder = null;
    this.mediaRecorder = null;
    this.audioContext = null;
    this.audioChunks = null;
    this.audio = null;
    this.stream = null;
    this.videoFile = null;
    this.videoFileName = null;
    this.isVideoSent = null;
    this.isTextSent = null;
    this.isVoiceSent = null;
    this.isVoiceStopped = null;
  },
});

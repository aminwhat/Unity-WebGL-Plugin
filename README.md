# Unity WebGL Microphone, Video, and File Upload Plugin

This repository contains a **Unity WebGL JavaScript plugin** (a `.jslib` file) that exposes browser multimedia and file APIs to Unity via the WebGL plugin interface.  
It enables:

- Microphone access & audio recording  
- Audio playback & caching  
- Video file selection & upload  
- Chunked uploads for large audio/video files  
- Progress tracking for text, audio, and video submissions  
- Clearing caches between questions or sessions  

> The JavaScript side is designed to be paired with Unity C# calls using `[DllImport("__Internal")]`.  
> Save the `.jslib` code below as `Assets/Plugins/WebGL/MyWebGLPlugin.jslib` in your Unity project.

---

## Features

- 🎤 **Microphone Support** — Request permission, start/stop recording, check if audio is saved  
- ▶️ **Playback Controls** — Play / pause / resume recorded audio  
- 📼 **Video Selection** — Use browser’s file picker to select a video file (uses `showOpenFilePicker`)  
- 📤 **Chunked Uploads** — Upload audio/video in 100 KB chunks to a server endpoint to avoid memory issues  
- 📊 **Upload Progress & Modes** — Poll for progress value and progress mode (e.g. `voice`, `video`, `done`)  
- 🧹 **Cache Clearing** — Clear audio/video caches between submissions or questions  

---

## Full JavaScript plugin (copy this file)

Save this text exactly as `Assets/Plugins/WebGL/MyWebGLPlugin.jslib`:

```javascript
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
```

---

## Unity C# extern declarations

Add these in a C# file where you call into the plugin (e.g. `WebGLPluginBridge.cs`):

```csharp
using System.Runtime.InteropServices;

public static class WebGLPluginBridge
{
    [DllImport("__Internal")] public static extern void Initialize(string mode, string applicationName);
    [DllImport("__Internal")] public static extern void MicroPhonePremission();
    [DllImport("__Internal")] public static extern bool IsMicroPhonePremission();
    [DllImport("__Internal")] public static extern void StartRecording();
    [DllImport("__Internal")] public static extern bool IsStartRecording();
    [DllImport("__Internal")] public static extern void StopRecording();
    [DllImport("__Internal")] public static extern bool IsVoiceStopped();
    [DllImport("__Internal")] public static extern bool IsVoiceSaved();
    [DllImport("__Internal")] public static extern void PlaySavedVoice();
    [DllImport("__Internal")] public static extern void PauseSavedVoice();
    [DllImport("__Internal")] public static extern void ResumeSavedVoice();
    [DllImport("__Internal")] public static extern void SelectVideoFile();
    [DllImport("__Internal")] public static extern bool IsVideoExists();
    [DllImport("__Internal")] public static extern string getVideoInfoVideoName();
    [DllImport("__Internal")] public static extern string getVideoInfoVideoSize();
    [DllImport("__Internal")] public static extern void Submit(string userId, int questionIndex, string text);
    [DllImport("__Internal")] public static extern string getProgress();
    [DllImport("__Internal")] public static extern string getProgressMode();
    [DllImport("__Internal")] public static extern void ClearAudioCache();
    [DllImport("__Internal")] public static extern void ClearVideoCache();
    [DllImport("__Internal")] public static extern void ClearCache();
}
```

> **Note**: In some Unity/WebGL setups you may prefer to declare the return type of `getProgress` / `getProgressMode` as `IntPtr` and then use `Marshal.PtrToStringAuto()` to convert the returned pointer to a managed string. However Unity's IL2CPP/WebGL will often marshal string results as shown above — test in your build.

---

## Example Unity usage (MonoBehaviour)

```csharp
using UnityEngine;

public class ExampleUsage : MonoBehaviour
{
    void Start()
    {
        // Initialize environment and application name ("karma" / "sazgar" / "aryan")
        WebGLPluginBridge.Initialize("production", "karma");

        // Request microphone permission (prompts user)
        WebGLPluginBridge.MicroPhonePremission();
    }

    void Update()
    {
        // Poll permission and progress to update UI
        if (WebGLPluginBridge.IsMicroPhonePremission())
        {
            // allow the record button
        }

        // Example of reading progress mode and progress value:
        string mode = WebGLPluginBridge.getProgressMode();
        string progress = WebGLPluginBridge.getProgress(); // returns stringified number (0-100)
    }

    public void OnStartRecordPressed()
    {
        WebGLPluginBridge.StartRecording();
    }

    public void OnStopRecordPressed()
    {
        WebGLPluginBridge.StopRecording();
    }

    public void OnPlayRecorded()
    {
        WebGLPluginBridge.PlaySavedVoice();
    }

    public void OnSelectVideo()
    {
        WebGLPluginBridge.SelectVideoFile();
    }

    public void OnSubmit(string userId, int questionIndex, string text)
    {
        WebGLPluginBridge.Submit(userId, questionIndex, text);
    }
}
```

---

## Server endpoints expected (plugin-side)

The plugin expects the following endpoints under `baseUrl`:

- `POST /manager` — receives `{ userId, questionIndex, text }` (JSON)  
- Multiple `POST /voice/upload/:userId/:questionIndex` — binary chunks of voice (100 KB)  
- `POST /voice/submit` — final voice submit metadata `{ userId, questionIndex }`  
- Multiple `POST /video/upload/:userId/:questionIndex` — binary chunks of video (100 KB)  
- `POST /video/submit` — final video submit metadata `{ userId, questionIndex, fileType }`

Adjust your server-side to accept multiple chunk uploads and reassemble them.

---

## Known issues / tips

- **Bug in `getProgress()`** — The plugin code uses `String(progress)` and `lengthBytesUTF8(String(progress))` but `progress` is not a defined local variable there. It should likely use `this.progress`. If you see `0` or unexpected values, fix the function to reference `this.progress`. Example fix:

```javascript
getProgress: function () {
  if (this.progress === null || this.progress === undefined) {
    return 0;
  }
  var buffer = _malloc(lengthBytesUTF8(String(this.progress)) + 1);
  writeStringToMemory(String(this.progress), buffer);
  return buffer;
},
```

- **`showOpenFilePicker` support** — Not all browsers support the modern file picker. Fallbacks (e.g., an `<input type="file">`) can be implemented if you need wider browser support.
- **HTTPS** — Microphone access requires a secure context (HTTPS) except when using `localhost` during development.
- **Memory / chunk sizes** — The code chunks by `102400` (100 KB); you can change this size to tune upload performance vs. memory usage.
- **Error handling** — The plugin logs errors to the browser console. Add more robust retry or user-facing error messages in production.
- **Large files & timeouts** — The fetch calls use `AbortSignal.timeout(900000)` (15 minutes) to allow large uploads. Tune according to your server/network.

---

## Browser Compatibility

- Microphone: works on modern browsers when served over HTTPS (Chrome, Edge, Firefox).  
- File picker: `showOpenFilePicker` is currently best supported in Chromium-based browsers. For others, the plugin will alert the user in Persian ("این قابلیت در این مرورگر پشتیبانی نمی شود").

---

## Troubleshooting

- If recorded audio won't play, open DevTools console to see errors and confirm `this.audioUrl` exists.  
- If `getVideoInfoVideoName` or `getVideoInfoVideoSize` return empty, ensure `SelectVideoFile()` was called and the user picked a file.  
- On mobile browsers, MediaRecorder or showOpenFilePicker may not be available — consider mobile-specific fallbacks.

---

## Contributing

Contributions welcome. If you:
1. Find bugs (e.g. `getProgress()` bug), please open an issue and submit a PR.  
2. Want to add features (e.g., file picker fallback, retry logic, progress callbacks to Unity), open an issue to discuss before implementing.

---

## License

MIT License — copy, modify, and distribute. Attribution appreciated but not required.

---

## Contact

If you'd like, I can also:
- Create a small Unity demo scene that integrates this plugin and demonstrates recording, picking a video, and submitting.
- Create a GitHub Actions workflow to run a static check or build a test WebGL build.

Tell me which and I’ll add it to the repo.

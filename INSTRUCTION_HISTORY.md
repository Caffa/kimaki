
## 2026-04-30T06:30:59.868Z

Yes, disable the auto-upgrade and make it skip when npm link is detected.

## 2026-04-30T06:32:05.677Z

Change the /upgrade-and-restart and add warnings about this problem with auto-upgrade to AGENT.md

## 2026-04-30T07:01:01.125Z

restart kimaki and verify it works

## 2026-05-11T06:03:38.787Z

Readd the figlet banner.

## 2026-05-11T06:10:22.677Z

■  14:08 VOICE    [ASR] Failed to start ASR service: {
│    name: 'ReferenceError',
│    message: '__dirname is not defined',
│    stack: 'ReferenceError: __dirname is not defined\n' +
│      '    at getAsrServicePath (file:///Users/caffae/Local-Projects-2026/kimaki/cli/dist/asr-service-manager.js:27:19)\n' +
│      '    at startAsrService (file:///Users/caffae/Local-Projects-2026/kimaki/cli/dist/asr-service-manager.js:71:25)\n' +
│      '    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)\n' +
│      '    at async startDiscordBot (file:///Users/caffae/Local-Projects-2026/kimaki/cli/dist/discord-bot.js:972:9)\n' +
│      '    at async run (file:///Users/caffae/Local-Projects-2026/kimaki/cli/dist/cli-runner.js:1176:9)\n' +
│      '    at async Goke.<anonymous> (file:///Users/caffae/Local-Projects-2026/kimaki/cli/dist/cli.js:170:9)',
│    cause: undefined
│  }

there is an error

## 2026-05-11T06:17:24.429Z

There is a bug with my updated kimaki. It gave `  14:16 SESSION  [LISTENER] Connected to event stream for thread 1503279247735783506` on repeat. After I started a new thread, and the new thread only has `using opencode/big-pickle` sent over, before it just stopped sending anything.

## 2026-05-11T06:21:02.422Z

I tried this again with a reply to an existing thread and it is sending SESSION  [LISTENER] Connected to event stream for thread 1503068656274505750
│  14:20 SESSION  [LISTENER] Connected to event stream for thread 1503068656274505750 repeatedly.

## 2026-05-11T06:21:37.422Z

This only happened after I tried to update to upstream code in https://github.com/remorses/kimaki/commits/main/ and added my old changes on tope

## 2026-05-11T07:13:42.896Z

I tested and the │  15:13 SESSION  [LISTENER] Connected to event stream for thread 1503279247735783506
│  15:13 SESSION  [LISTENER] Connected to event stream for thread 1503279247735783506
│  15:13 SESSION  [LISTENER] Connected to event stream for thread 1503279247735783506
│  15:13 SESSION  [LISTENER] Connected to event stream for thread 1503279247735783506
│  15:13 SESSION  [LISTENER] Connected to event stream for thread 1503279247735783506
│  15:13 SESSION  [LISTENER] Connected to event stream for thread 1503279247735783506
│  15:13 SESSION  [LISTENER] Connected to event stream for thread 1503279247735783506

bug is still there. Did we do a local reinstall?

## 2026-05-11T08:38:32.661Z

restarted. Now there isn't the problem of repeated connections, but instead the bug now is that kimaki is not responding to my messages. I sent, it does not reply
│
└  ✨ Bot ready! Listening for messages...

│  16:35 CLI      Background channel sync completed for 2 guild(s)
│  16:35 CHANNEL  Default kimaki channel already exists: 1502726554852003880
│  16:35 CHANNEL  Default kimaki channel already exists: 1491674631940210728
│  16:35 DISCORD  Message in thread I found that the Advanced Custom Pronunciation module isn't well designed. It do (1503273969430823145)
│  16:35 VOICE    [SESSION] Found session ses_1ea6674f9ffegKiPJRMcc1lXeP for thread 1503273969430823145
│  16:37 VOICE    [GUILD_TEXT] Message in text channel #kimaki-pie-kimaki-pi (1502726554852003880)
│  16:37 DISCORD  DIRECTORY: Found kimaki.directory: /Users/caffae/.kimaki/projects/kimaki
│  16:37 DISCORD  Created thread "How do I remove kimaki from this channel, because I have another discord server" (1503315080559984701)

## 2026-05-11T09:29:54.518Z

Did you do a relink?

## 2026-05-11T09:30:32.072Z

I keep getting the reconnection message:
  17:30 DISCORD  Message in thread I found that the Advanced Custom Pronunciation module isn't well designed. It do (1503273969430823145)
│  17:30 VOICE    [SESSION] Found session ses_1ea6674f9ffegKiPJRMcc1lXeP for thread 1503273969430823145
│  17:30 SESSION  [SESSION EVENT DB] Hydrated 943 events for session ses_1ea6674f9ffegKiPJRMcc1lXeP
│  17:30 SESSION  [LISTENER] Connected to event stream for thread 1503273969430823145
│  17:30 SESSION  [INGRESS] promptAsync accepted by opencode queue sessionId=ses_1ea6674f9ffegKiPJRMcc1lXeP threadId=1503273969430823145
│  17:30 SESSION  [LISTENER] Event stream ended for thread 1503273969430823145, reconnecting in 500ms
│  17:30 SESSION  [LISTENER] Connected to event stream for thread 1503273969430823145

## 2026-05-11T09:31:41.078Z

Could it be that opencode is not updated. Or is this the new updated kimaki code. Or my modifications? Can we systematically investigate?

## 2026-05-11T10:00:24.825Z

Can we just upgrade the SDK? Explain why or why not.

## 2026-05-11T10:05:23.274Z

Continue. Form hypothesis about what is wrong. Create a todo list to go through all the hypothesis. Focus on testing to verify your assumptions. Use subagents for tasks that don't rely on each other.

## 2026-05-11T10:18:22.214Z

Could it be that I have another session of Kimaki open in the background? Because it seems like I have Kimaki running (new discord sync session) when I have not opened a terminal for it. I think I might have opened it in the background.

## 2026-05-11T10:19:02.078Z

I am running opencode separately

## 2026-05-11T10:31:08.549Z

Check the documentation for opencode. I would rather use the most recent sdk. Please change if possible

## 2026-05-11T11:23:34.479Z

restarted, testing now. Error:

│  19:22 CHANNEL  Default kimaki channel already exists: 1502726554852003880
│  19:22 CHANNEL  Default kimaki channel already exists: 1491674631940210728
■  19:22 OPENCODE ERROR 2026-05-11T11:22:04 +5919ms service=mcp clientName=context7 error=MCP error -32601: Method not found failed to get prompts
▲  19:22 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_1ed516134ffe2gJNc46o6EGkx2: todos.findIndex is not a function
▲  19:22 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_1ed516134ffe2gJNc46o6EGkx2: todos.findIndex is not a function
▲  19:22 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_1ed516134ffe2gJNc46o6EGkx2: todos.findIndex is not a function
▲  19:22 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_1ed516134ffe2gJNc46o6EGkx2: todos.findIndex is not a function
▲  19:22 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_1ed516134ffe2gJNc46o6EGkx2: todos.findIndex is not a function
▲  19:22 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_1ed516134ffe2gJNc46o6EGkx2: todos.findIndex is not a function
▲  19:22 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_1ed516134ffe2gJNc46o6EGkx2: todos.findIndex is not a function
▲  19:22 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_1ed516134ffe2gJNc46o6EGkx2: todos.findIndex is not a function
▲  19:22 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_1ed516134ffe2gJNc46o6EGkx2: todos.findIndex is not a function
▲  19:22 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_1ed516134ffe2gJNc46o6EGkx2: todos.findIndex is not a function
●  19:22 CLI      COMMANDS: Successfully registered 96 slash commands for 2 guild(s)
│  19:22 CLI      Slash commands registered!
▲  19:22 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_1ed516134ffe2gJNc46o6EGkx2: todos.findIndex is not a function
▲  19:22 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_1ed516134ffe2gJNc46o6EGkx2: todos.findIndex is not a function
▲  19:23 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_1ed516134ffe2gJNc46o6EGkx2: todos.findIndex is not a function
▲  19:23 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_1ed516134ffe2gJNc46o6EGkx2: todos.findIndex is not a function
│  19:23 VOICE    [GUILD_TEXT] Message in text channel #telegram-to-router (1492380580405317744)
│  19:23 DISCORD  DIRECTORY: Found kimaki.directory: /Users/caffae/Local-Projects-2026/Simple-Bot-Checker-Listener/Telegram-To-Router
▲  19:23 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_1ed516134ffe2gJNc46o6EGkx2: todos.findIndex is not a function
│  19:23 DISCORD  Created thread "Evaluate the code for any logic bugs. Give me an outline of the features." (1503356804485087282)
│  19:23 SESSION  [LISTENER] Subscribing to event stream for thread 1503356804485087282 directory=/Users/caffae/Local-Projects-2026/Simple-Bot-Checker-Listener/Telegram-To-Router
│  19:23 SESSION  [LISTENER] Connected to global event stream for thread 1503356804485087282
│  19:23 MODEL    [MODEL] Snapshotted session model ollama-cloud/glm-5.1 for session ses_1e9391a29ffeb5isAE5Ke9oM7s
│  19:23 SESSION  [INGRESS] promptAsync accepted by opencode queue sessionId=ses_1e9391a29ffeb5isAE5Ke9oM7s threadId=1503356804485087282
│  19:23 SESSION  [SESSION IDLE] session became idle sessionId=ses_1e9391a29ffeb5isAE5Ke9oM7s drainQueue=false phase=idle,assistant=msg_e16c6e8cb001iz4FUxdMkJ6y2B,assistantCount=1
▲  19:23 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_1ed516134ffe2gJNc46o6EGkx2: todos.findIndex is not a function
│  19:23 SESSION  [TITLE] Renamed thread 1503356804485087282 to "Logic review and feature outline" from OpenCode session title
▲  19:23 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_1ed516134ffe2gJNc46o6EGkx2: todos.findIndex is not a function

## 2026-05-11T11:53:00.702Z

Fix the todos.findIndex error

## 2026-05-11T11:54:35.677Z

Fix the todos.findIndex error

## 2026-05-11T11:56:27.990Z

Fix the todos.findIndex error

## 2026-05-11T11:56:41.413Z

continue

## 2026-05-11T16:50:23.875Z

Fix the todos.findIndex error

## 2026-05-12T04:54:47.014Z

I want to do adjust my settings. I have two discord servers connected to kimaki, there is one with many channels which I don't want to change anything about, and a new one with only the kimaki-pie-kimaki-pi channels. I want to set the new one for conversation. I want to give it a separate project directory /Users/caffae/Local-Projects-2026/Many-Bots-Kimaki from the other discord server. Assess how you will need to code this. 

This is a Kimaki Discord server that is not a coding server, it's going to be made for conversation. So I want to make something a bot with each new chat (in general, which creates channels) and I'll put these bots in a special folder that's a different project directory (so this server is in a different project directory). The goal here is that when I make a new project (in general), I want to make a different bot each time (fix its AGENT.md in its project folder) and I'm refining this bot over time, but also using it. So I tell this bot what it should do and then every time I run a thread in that channel (this bot will have that personality I set). So for example, a decision bot that tries to think about what is good for me in the long run and then it helps me organize experiments to see if this thing is actually good for me or bad for me instead of me giving excuses and deciding that I want to quit something that is actually good for me.

## 2026-05-12T06:34:31.631Z

I think the system has the ability to set a project directory per server, right?

## 2026-05-12T06:39:56.130Z

Slightly different. I want to set a default parent directory once for Server B, and All channels created in that server (if creating a new channel) will create a folder in that parent directory, where that folder is the project folder for that cahnnel.

I think we have this functionality for Server A, where it creates aa folder for any new projects in /Users/caffae/Local-Projects-2026.

Check if it does. If there is no such functionality, implement it.

## 2026-05-12T06:43:39.145Z

Yes, please implement it.

Also just run the setting of the default-dir for both servers for me

## 2026-05-12T08:18:57.190Z

Server ID: 1486966847810043924
Directory: /Users/caffae/Local-Projects-2026

Server ID: 1474778629266342000
Directory: /Users/caffae/Local-Projects-2026/Many-Bots-Kimaki

## 2026-05-12T08:19:09.997Z

Help me set the default dir for these two servers

## 2026-05-12T08:25:38.798Z

commit and push.

## 2026-05-12T09:39:03.220Z

add AGENTS.md auto-creation for new channels too

## 2026-05-12T11:06:09.975Z

There seems to be a bug with the model command because I tried to run it and it says that the application did not respond. Check kimaki's slash commands

## 2026-05-12T16:16:57.809Z

@mariozechner/pi-coding-agent has been depreciated and the new version is @earendil-works/pi-tui

Can you work out how to fix this so my current pi-coding-agent can upgrade? This is npm

## 2026-05-12T16:18:53.785Z

I just want pi-coding-agent

## 2026-05-12T16:19:38.425Z

Yes, update them.

## 2026-05-12T16:22:40.530Z

I tested /model and still got The application did not respond

## 2026-05-12T16:51:31.940Z

/agent works but /model does not. I have restarted.

## 2026-05-12T18:04:56.285Z

test the /model command

## 2026-05-14T03:36:08.771Z

Our recent modifications seem to have broken my kimaki. I was trying to fix the local ASR and now kimaki is not responding to even text messages.

## 2026-05-14T05:00:35.590Z

rebuild for me

## 2026-05-14T05:01:52.159Z

There is a repeating bug and no proper reply:
  13:01 DISCORD  Message in thread Should I be waiting between serum applications to let it dry and absorb into my (1504347616316493835)
│  13:01 SESSION  No session for thread 1504347616316493835, starting new session
│  13:01 SESSION  [LISTENER] Subscribing to event stream for thread 1504347616316493835 directory=/Users/caffae/.kimaki/projects/decision-bot
│  13:01 SESSION  [LISTENER] Connected to event stream for thread 1504347616316493835
│  13:01 MODEL    [MODEL] Snapshotted session model ollama-cloud/glm-5.1 for session ses_1db23a011ffe2Nc7yXHEUFGH2J
│  13:01 SESSION  [INGRESS] promptAsync accepted by opencode queue sessionId=ses_1db23a011ffe2Nc7yXHEUFGH2J threadId=1504347616316493835
│  13:01 SESSION  [LISTENER] Stream ended normally for thread 1504347616316493835, reconnecting in 500ms
│  13:01 SESSION  [LISTENER] Subscribing to event stream for thread 1504347616316493835 directory=/Users/caffae/.kimaki/projects/decision-bot
│  13:01 SESSION  [LISTENER] Connected to event stream for thread 1504347616316493835
│  13:01 SESSION  [LISTENER] Stream ended normally for thread 1504347616316493835, reconnecting in 500ms
│  13:01 SESSION  [LISTENER] Subscribing to event stream for thread 1504347616316493835 directory=/Users/caffae/.kimaki/projects/decision-bot
│  13:01 SESSION  [LISTENER] Connected to event stream for thread 1504347616316493835
│  13:01 SESSION  [LISTENER] Stream ended normally for thread 1504347616316493835, reconnecting in 500ms
│  13:01 SESSION  [LISTENER] Subscribing to event stream for thread 1504347616316493835 directory=/Users/caffae/.kimaki/projects/decision-bot

## 2026-05-14T05:57:29.108Z

rebuild and test it

## 2026-05-14T06:01:11.790Z

It is working. Do a commit and note down what was fixed to solve this problem.

## 2026-05-29T11:21:10.950Z

There is a bug with my kimaki after recent modifications. Can you investigate? 

▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_3153532a1ffeSqScEQUZb18ozs: Failed to fetch parent channel 1482246698515435672
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_3148bda68ffeX6oE2CBqrXDZo5: Failed to fetch parent channel 1482246698515435672
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_314011102ffeizkA5LITfQ7Hit: Failed to fetch parent channel 1482246698515435672
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_31062f4e0fferyyH4kFeM97L6Q: Failed to fetch parent channel 1482246698515435672
│  19:19 ASR      [ASR] Starting ASR service on 127.0.0.1:8765
│  Model: mlx-community/parakeet-tdt-0.6b-v3
│  Loading parakeet-mlx model: mlx-community/parakeet-tdt-0.6b-v3
│  Model loaded successfully
│  INFO:     127.0.0.1:64361 - "GET /health HTTP/1.1" 200 OK
│  19:19 ASR      ASR service started successfully
│  19:19 CLI      Discord bot is running!
│
◇  ⚠️  Keep Running ────────────────────────────────────────────────────────────────────────────╮
│                                                                                               │
│  Leave this process running to keep the bot active.                                           │
│                                                                                               │
│  If you close this process or restart your machine, run `npx kimaki` again to start the bot.  │
│                                                                                               │
├───────────────────────────────────────────────────────────────────────────────────────────────╯
│
└  ✨ Bot ready! Listening for messages...

│  19:19 CLI      Background channel sync completed for 2 guild(s)
│  19:19 CHANNEL  Default kimaki channel already exists: 1502726554852003880
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_30845119dffeYwXMBKqI9BFkb8: Failed to fetch parent channel 1483156911145746554
│  19:19 CHANNEL  Default kimaki channel already exists: 1491674631940210728
■  19:19 OPENCODE ERROR 2026-05-29T11:19:36 +6907ms service=mcp clientName=context7 error=MCP error -32601: Method not found failed to get prompts
●  19:19 CLI      COMMANDS: Successfully registered 90 slash commands for 2 guild(s)
│  19:19 CLI      Slash commands registered!
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_3153532a1ffeSqScEQUZb18ozs: Failed to fetch parent channel 1482246698515435672
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_3148bda68ffeX6oE2CBqrXDZo5: Failed to fetch parent channel 1482246698515435672
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_314011102ffeizkA5LITfQ7Hit: Failed to fetch parent channel 1482246698515435672
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_31062f4e0fferyyH4kFeM97L6Q: Failed to fetch parent channel 1482246698515435672
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_30845119dffeYwXMBKqI9BFkb8: Failed to fetch parent channel 1483156911145746554
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_3153532a1ffeSqScEQUZb18ozs: Failed to fetch parent channel 1482246698515435672
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_3148bda68ffeX6oE2CBqrXDZo5: Failed to fetch parent channel 1482246698515435672
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_314011102ffeizkA5LITfQ7Hit: Failed to fetch parent channel 1482246698515435672
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_31062f4e0fferyyH4kFeM97L6Q: Failed to fetch parent channel 1482246698515435672
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_30845119dffeYwXMBKqI9BFkb8: Failed to fetch parent channel 1483156911145746554
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_3153532a1ffeSqScEQUZb18ozs: Failed to fetch parent channel 1482246698515435672
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_3148bda68ffeX6oE2CBqrXDZo5: Failed to fetch parent channel 1482246698515435672
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_314011102ffeizkA5LITfQ7Hit: Failed to fetch parent channel 1482246698515435672
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_31062f4e0fferyyH4kFeM97L6Q: Failed to fetch parent channel 1482246698515435672
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_30845119dffeYwXMBKqI9BFkb8: Failed to fetch parent channel 1483156911145746554
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_3153532a1ffeSqScEQUZb18ozs: Failed to fetch parent channel 1482246698515435672
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_3148bda68ffeX6oE2CBqrXDZo5: Failed to fetch parent channel 1482246698515435672
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_314011102ffeizkA5LITfQ7Hit: Failed to fetch parent channel 1482246698515435672
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_31062f4e0fferyyH4kFeM97L6Q: Failed to fetch parent channel 1482246698515435672
▲  19:19 OPENCODE [EXTERNAL_SYNC] Failed syncing session ses_30845119dffeYwXMBKqI9BFkb8: Failed to fetch parent channel 1483156911145746554

## 2026-05-29T11:21:21.711Z

There is also this error Failed to save model preference: SQLITE_ERROR: near "offset": syntax error

## 2026-05-29T12:30:22.546Z

Continue

## 2026-05-29T12:48:05.449Z

Can you modify the error, so that it has this explanation? So that when this is printed to the log we know it is not a bug but instead expected behavior.

## 2026-06-07T03:18:18.850Z

Something is wrong with Kimaki. I think the problem is that it did a background upgrade, which I don't want it to ever do because I'm doing my own fork of Kimaki instead of running the official original version. So make sure you disable that and then cheque what is wrong now because after it did the background upgrade, I sent messages and it is not responding to the messages.

## 2026-06-07T03:23:03.375Z

Do option 1, and restore my fork version to global. checking why messages weren't being responded to

## 2026-06-07T03:23:37.694Z

Note that my zsh is at "/Users/caffae/minimal_dotfiles/zsh/01_path.zsh"

## 2026-06-07T03:27:57.313Z

I'm trying to run Kemaki and it is not responding to my messages. I'm not sure what is wrong because it has created the thread but I don't have any notification that the agent is even thinking. So can you double cheque why it's not responding to my messages? Could it be a problem with open code because I just changed my opencode configuration.

## 2026-06-07T03:30:40.466Z

You can also check the logging for how the currently running Kimaki is not responding to the message.

## 2026-06-07T03:34:37.323Z

Open code definitely seems to be working. I think Kimaki is the one having issues.

## 2026-06-07T03:35:19.005Z

Kimaki is not even picking up on messages in the opencode instance when it would usually sync

## 2026-06-07T03:43:12.240Z

Could it be that I have an upgraded opencode version that changed the api between it and kimaki?

## 2026-06-07T04:51:37.760Z

I upgraded it. Can you check the original Kimaki to see how they handled upgrading to a newer version of Open Code SDK? Because I would like to use a newer version of Open Code because I assume that they have done a great deal of changes. So can you check the Open Code GitHub repo too to see what changes there are and whether or not we can upgrade to the new version and just change our code?

## 2026-06-07T05:03:13.229Z

Commit so that I can revert back to this stage if necessary and then we can try and cherry pick some of the SDK commits or we could just try to apply the changes that I want from my version to the online Kimaki version. There are a few things I want to do. I want to sync both open code and Pi sessions into my discord just so that I know that these sessions existed for Pi. If I can't send commands to Pi, I still want to know that we have had runs in this directory. But that's only if it's possible. Then most importantly, I want to make sure that we have our audio transcription, the local audio transcription over here and the banner to show that it is the local transcription version of Kimaki on startup. I also have changes to ensure that even if the model is not capable of vision, I will route any pictures given to a local vision model so that it can at least get a description of the picture instead of telling me that it can't see the picture.

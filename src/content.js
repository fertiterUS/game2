window.GameContent = {
  startRoom: "church",
  startPosition: { x: 9, y: 8 },
  openingDialogue: "wakeUp",
  tileSize: 32,
  objective: "离开教堂。",
  controls: [
    "WASD / 方向键：移动",
    "E / 空格：互动或推进对白",
    "J：打开记录",
    "Shift：缓慢行走"
  ],
  player: {
    name: "林夏",
    color: "#cfd9c1",
    shadow: "#5c6b55"
  },
  items: {},
  flags: {
    spokeToElder: false
  },
  rooms: {
    church: {
      name: "旧教堂",
      ambient: "#10100f",
      floor: "#1a1916",
      wall: "#37322a",
      fog: "#070707",
      musicMood: "thin",
      map: [
        "###################",
        "#........A........#",
        "#.................#",
        "#....B.......B....#",
        "#....B.......B....#",
        "#........N........#",
        "#.................#",
        "#....B.......B....#",
        "#.................#",
        "#.................#",
        "#########D#########"
      ],
      spawnPoints: {},
      exits: [
        {
          id: "churchDoor",
          x: 9,
          y: 10,
          label: "走出教堂",
          requiredFlag: "spokeToElder",
          lockedDialogue: "elderFirst",
          ending: "partOneEnd"
        }
      ],
      interactables: [
        {
          id: "elder",
          x: 9,
          y: 5,
          label: "和老人说话",
          dialogue: "elderIntro"
        },
        {
          id: "altar",
          x: 9,
          y: 1,
          label: "查看祭坛",
          dialogue: "altar"
        },
        {
          id: "leftPew",
          x: 5,
          y: 4,
          label: "查看长椅",
          dialogue: "pew"
        }
      ]
    }
  },
  dialogues: {
    wakeUp: {
      speaker: "林夏",
      lines: [
        "冰冷的石砖贴着脸。你睁开眼，头顶是褪色的彩窗。",
        "空气里有蜡油和潮湿木头的味道。远处的钟声停在最后一下。",
        "一位老人坐在不远处，像是一直在等你醒来。"
      ],
      journal: "我在一座旧教堂里醒来。身边有一位老人。",
      choices: [{ text: "起身", close: true }]
    },
    elderIntro: {
      speaker: "老人",
      lines: [
        "“你终于醒了。”",
        "老人没有靠近，只把一盏快要熄灭的油灯推到你面前。",
        "“别问这里是哪。先记住今天的日期。”",
        "“1999 年 12 月 31 日。再过不久，钟声会重新响起。”"
      ],
      journal: "老人说，现在是 1999 年 12 月 31 日。",
      choices: [{ text: "记住日期", close: true, setFlag: "spokeToElder" }]
    },
    elderFirst: {
      speaker: "老人",
      lines: [
        "你刚走向教堂门口，老人沙哑的声音从身后传来。",
        "“先听我说完。至少，记住今天是哪一天。”"
      ],
      choices: [{ text: "回头", close: true }]
    },
    altar: {
      speaker: "祭坛",
      lines: [
        "祭坛上没有十字架，只有一圈被擦掉又重新写上的日期。",
        "最清楚的一行是：1999.12.31。"
      ],
      journal: "祭坛上反复出现同一个日期：1999.12.31。",
      choices: [{ text: "离开", close: true }]
    },
    pew: {
      speaker: "长椅",
      lines: [
        "木质长椅上积着很薄的灰。",
        "灰尘里有一排脚印，停在你醒来的位置旁边。"
      ],
      choices: [{ text: "离开", close: true }]
    }
  },
  endings: {
    partOneEnd: {
      title: "第一部分结束",
      lines: [
        "你推开教堂沉重的门。",
        "门外没有街道，没有风，也没有光。",
        "黑暗合上来，钟声重新响起。"
      ]
    }
  }
};

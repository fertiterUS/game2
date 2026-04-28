window.GameContent = {
  startRoom: "lobby",
  startPosition: { x: 6, y: 8 },
  tileSize: 32,
  objective: "找到旧楼停电的原因。",
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
  items: {
    rustKey: {
      name: "生锈钥匙",
      description: "像是三楼资料室的钥匙，边缘残留着黑色灰尘。"
    },
    fuse: {
      name: "保险丝",
      description: "还能用，但拿在手里有轻微的温热。"
    }
  },
  flags: {
    hasReadNotice: false,
    generatorAwake: false,
    heardKnock: false
  },
  rooms: {
    lobby: {
      name: "一层大厅",
      ambient: "#101615",
      floor: "#17201e",
      wall: "#2c3734",
      fog: "#09100f",
      musicMood: "low",
      map: [
        "########################",
        "#..........#...........#",
        "#..........#....N......#",
        "#..........#...........#",
        "#......................#",
        "#....A.................#",
        "#......................#",
        "#..........#######.....#",
        "#..........#.....#..S..#",
        "#..........#..B..#.....#",
        "#..........#.....#.....#",
        "###################D####"
      ],
      spawnPoints: {
        fromOffice: { x: 19, y: 9 },
        fromBasement: { x: 20, y: 10 }
      },
      exits: [
        {
          id: "officeDoor",
          x: 19,
          y: 11,
          label: "去值班室",
          targetRoom: "office",
          targetSpawn: "fromLobby",
          requiredFlag: "hasReadNotice",
          lockedDialogue: "noticeFirst"
        },
        {
          id: "stairsDown",
          x: 22,
          y: 8,
          label: "下到配电间",
          targetRoom: "basement",
          targetSpawn: "fromLobby",
          requiredItem: "fuse",
          lockedDialogue: "needFuse"
        }
      ],
      interactables: [
        {
          id: "notice",
          x: 5,
          y: 5,
          label: "查看公告栏",
          dialogue: "notice",
          onceFlag: "hasReadNotice"
        },
        {
          id: "neighbor",
          x: 16,
          y: 2,
          label: "和保洁阿姨说话",
          dialogue: "neighbor"
        },
        {
          id: "bag",
          x: 14,
          y: 9,
          label: "检查布包",
          dialogue: "bag",
          giveItem: "fuse",
          onceFlag: "tookFuse"
        },
        {
          id: "stairs",
          x: 21,
          y: 8,
          label: "查看楼梯间",
          dialogue: "stairs"
        }
      ]
    },
    office: {
      name: "值班室",
      ambient: "#141311",
      floor: "#211e1a",
      wall: "#3b342c",
      fog: "#0c0908",
      musicMood: "thin",
      map: [
        "################",
        "#..............#",
        "#..T.......C...#",
        "#..............#",
        "#......####....#",
        "#......#..#....#",
        "#..K...#..#....#",
        "#..............#",
        "######D#########"
      ],
      spawnPoints: {
        fromLobby: { x: 6, y: 7 }
      },
      exits: [
        {
          id: "officeExit",
          x: 6,
          y: 8,
          label: "回到大厅",
          targetRoom: "lobby",
          targetSpawn: "fromOffice"
        }
      ],
      interactables: [
        {
          id: "telephone",
          x: 3,
          y: 2,
          label: "接起电话",
          dialogue: "telephone",
          setFlag: "heardKnock"
        },
        {
          id: "cabinet",
          x: 10,
          y: 2,
          label: "翻找柜子",
          dialogue: "cabinet",
          giveItem: "rustKey",
          onceFlag: "tookRustKey"
        },
        {
          id: "locker",
          x: 3,
          y: 6,
          label: "检查钥匙板",
          dialogue: "keyBoard"
        }
      ]
    },
    basement: {
      name: "配电间",
      ambient: "#0b1116",
      floor: "#121a20",
      wall: "#27333c",
      fog: "#060a0e",
      musicMood: "pulse",
      map: [
        "####################",
        "#.............#....#",
        "#.............#....#",
        "#..G..........#....#",
        "#.............#....#",
        "#.......#######....#",
        "#..................#",
        "#..............R...#",
        "##########D#########"
      ],
      spawnPoints: {
        fromLobby: { x: 10, y: 7 }
      },
      exits: [
        {
          id: "basementExit",
          x: 10,
          y: 8,
          label: "回到大厅",
          targetRoom: "lobby",
          targetSpawn: "fromBasement"
        }
      ],
      interactables: [
        {
          id: "generator",
          x: 3,
          y: 3,
          label: "更换保险丝",
          dialogue: "generator",
          requiredItem: "fuse",
          setFlag: "generatorAwake"
        },
        {
          id: "redDoor",
          x: 15,
          y: 7,
          label: "听红门后面",
          dialogue: "redDoor",
          requiredItem: "rustKey",
          requiredFlag: "generatorAwake",
          lockedDialogue: "needPower"
        }
      ]
    }
  },
  dialogues: {
    intro: {
      speaker: "林夏",
      lines: [
        "雨停之后，旧楼里只剩应急灯还亮着。",
        "物业说可能只是跳闸。可大厅里的监控屏，正一遍遍播放三分钟前的我。"
      ],
      choices: [{ text: "开始调查", close: true }]
    },
    notice: {
      speaker: "公告栏",
      lines: [
        "纸张被水汽泡皱，只能看清最后一行：",
        "“夜间巡查请从值班室领取备用钥匙。若听见地下室有人敲门，请勿回应。”"
      ],
      journal: "公告栏提到：值班室有备用钥匙，地下室的敲门声不要回应。",
      choices: [{ text: "记下", close: true }]
    },
    neighbor: {
      speaker: "保洁阿姨",
      lines: [
        "“你也是来找电闸的？刚才有个穿雨衣的人先进去了。”",
        "她盯着你身后的黑暗，声音压得很低：“可我没看见他出来。”"
      ],
      choices: [
        { text: "问雨衣人的样子", next: "neighborCoat" },
        { text: "离开", close: true }
      ]
    },
    neighborCoat: {
      speaker: "保洁阿姨",
      lines: [
        "“帽檐太低，看不清脸。”",
        "“不过他鞋底没水，像是本来就在楼里。”"
      ],
      journal: "保洁阿姨说，穿雨衣的人先进了旧楼，但鞋底没有水。",
      choices: [{ text: "离开", close: true }]
    },
    bag: {
      speaker: "布包",
      lines: [
        "包里有一枚旧保险丝，还有一张湿透的维修单。",
        "维修单日期是明天。"
      ],
      journal: "拿到保险丝。维修单上的日期不对。",
      choices: [{ text: "收起保险丝", close: true }]
    },
    stairs: {
      speaker: "楼梯间",
      lines: [
        "楼梯下方传来很轻的金属摩擦声。",
        "像有人在黑暗里拖着一串钥匙。"
      ],
      choices: [{ text: "先不下去", close: true }]
    },
    noticeFirst: {
      speaker: "门禁",
      lines: ["值班室门旁的提示灯闪了一下。你最好先看看大厅里有没有进入说明。"],
      choices: [{ text: "返回", close: true }]
    },
    needFuse: {
      speaker: "楼梯间",
      lines: ["地下室一片漆黑。没有备用保险丝，下去也无法恢复配电。"],
      choices: [{ text: "返回", close: true }]
    },
    needPower: {
      speaker: "红门",
      lines: ["门锁没有反应。配电恢复之前，这扇门像是从另一边被钉死了。"],
      choices: [{ text: "返回", close: true }]
    },
    telephone: {
      speaker: "电话",
      lines: [
        "听筒里先是雨声，然后是你的呼吸声。",
        "一个很近的声音说：“不要回头。门外那个人，学会了敲门。”",
        "值班室门被轻轻敲了三下。"
      ],
      journal: "电话里的声音提醒我：不要回应地下室的敲门。",
      choices: [{ text: "放下电话", close: true }]
    },
    cabinet: {
      speaker: "档案柜",
      lines: [
        "抽屉里只有一把生锈钥匙，钥匙牌写着“B1-红门”。",
        "抽屉深处有一小撮潮湿的头发。"
      ],
      journal: "拿到 B1 红门钥匙。",
      choices: [{ text: "收起钥匙", close: true }]
    },
    keyBoard: {
      speaker: "钥匙板",
      lines: [
        "所有钥匙都挂得整整齐齐。",
        "只有标着“备用出口”的位置空着，钉子上还在往下滴水。"
      ],
      choices: [{ text: "离开", close: true }]
    },
    generator: {
      speaker: "配电箱",
      lines: [
        "保险丝卡进槽位的瞬间，整栋楼的灯像醒来一样亮了一下。",
        "墙内传来密密麻麻的脚步声，随后又全部安静。",
        "配电箱屏幕出现一行字：B1 红门已解锁。"
      ],
      journal: "配电恢复了一瞬。B1 红门似乎可以打开了。",
      choices: [{ text: "后退", close: true }]
    },
    redDoor: {
      speaker: "红门",
      lines: [
        "你把钥匙插进锁孔。门内立刻响起敲门声。",
        "一声、两声、三声。",
        "第四声响起时，你发现声音来自你身后的楼梯间。"
      ],
      journal: "红门内的敲门声不止来自门内。这里可以接下一段剧情。",
      choices: [
        { text: "打开门（占位）", next: "chapterEnd" },
        { text: "暂时离开", close: true }
      ]
    },
    chapterEnd: {
      speaker: "章节占位",
      lines: [
        "这里是第一章结尾的占位节点。",
        "你可以在 content.js 里继续添加新房间、新角色、新道具，或者把这里改成真正的剧情分支。"
      ],
      choices: [{ text: "结束占位剧情", close: true }]
    }
  }
};

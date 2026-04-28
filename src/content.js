(() => {
  function createMap(width, height, fill = ".") {
    return Array.from({ length: height }, () => Array.from({ length: width }, () => fill));
  }

  function put(map, x, y, glyph) {
    if (!map[y] || x < 0 || x >= map[y].length) return;
    map[y][x] = glyph;
  }

  function rect(map, x, y, width, height, glyph) {
    for (let yy = y; yy < y + height; yy += 1) {
      for (let xx = x; xx < x + width; xx += 1) put(map, xx, yy, glyph);
    }
  }

  function border(map, x, y, width, height, glyph) {
    for (let xx = x; xx < x + width; xx += 1) {
      put(map, xx, y, glyph);
      put(map, xx, y + height - 1, glyph);
    }
    for (let yy = y; yy < y + height; yy += 1) {
      put(map, x, yy, glyph);
      put(map, x + width - 1, yy, glyph);
    }
  }

  function scatter(map, points, glyph) {
    for (const [x, y] of points) put(map, x, y, glyph);
  }

  function addBuilding(map, x, y, width, height) {
    rect(map, x, y, width, height, "#");
  }

  function createCityMap() {
    const map = createMap(64, 64);

    rect(map, 1, 1, 62, 3, "~");
    rect(map, 1, 60, 62, 3, "~");
    rect(map, 1, 41, 4, 19, "~");
    rect(map, 2, 4, 61, 1, ",");
    rect(map, 2, 59, 61, 1, ",");

    rect(map, 27, 1, 3, 11, "=");
    rect(map, 7, 15, 56, 3, "=");
    rect(map, 5, 29, 58, 3, "=");
    rect(map, 5, 42, 58, 3, "=");
    rect(map, 5, 55, 58, 3, "=");
    rect(map, 17, 5, 3, 55, "=");
    rect(map, 31, 5, 3, 55, "=");
    rect(map, 47, 5, 3, 55, "=");
    rect(map, 57, 14, 3, 43, "=");

    rect(map, 3, 6, 11, 8, ",");
    scatter(map, [[4, 7], [6, 6], [10, 7], [4, 11], [8, 12], [12, 10]], "Y");
    put(map, 7, 9, "Q");
    put(map, 8, 13, "S");

    addBuilding(map, 13, 7, 9, 6);
    put(map, 17, 13, "S");
    addBuilding(map, 26, 7, 7, 6);
    put(map, 29, 13, "S");
    addBuilding(map, 37, 6, 10, 7);
    put(map, 42, 13, "S");
    addBuilding(map, 52, 7, 9, 6);
    put(map, 56, 13, "S");

    addBuilding(map, 6, 22, 8, 5);
    put(map, 10, 27, "S");
    addBuilding(map, 1, 29, 5, 8);
    put(map, 4, 33, "S");
    addBuilding(map, 8, 32, 10, 5);
    put(map, 13, 37, "S");

    rect(map, 22, 20, 21, 18, ",");
    border(map, 22, 20, 21, 18, "F");
    put(map, 31, 37, "=");
    put(map, 32, 37, "=");
    put(map, 33, 37, "=");
    rect(map, 28, 23, 9, 9, "#");
    put(map, 32, 22, "O");
    put(map, 32, 32, "D");
    scatter(map, [[23, 21], [41, 21], [24, 34], [40, 34], [25, 24], [39, 26], [27, 36], [37, 36]], "Y");

    addBuilding(map, 51, 22, 10, 6);
    put(map, 56, 28, "S");
    addBuilding(map, 49, 34, 12, 5);
    put(map, 55, 39, "S");
    addBuilding(map, 60, 22, 3, 9);
    put(map, 61, 31, "S");

    addBuilding(map, 8, 47, 10, 7);
    put(map, 13, 54, "S");
    addBuilding(map, 22, 47, 8, 7);
    put(map, 26, 54, "S");
    addBuilding(map, 38, 47, 8, 6);
    put(map, 42, 53, "S");
    addBuilding(map, 50, 47, 11, 6);
    put(map, 55, 53, "S");
    scatter(map, [[52, 54], [58, 54], [51, 56], [59, 56]], "Y");

    scatter(
      map,
      [
        [20, 16],
        [34, 16],
        [46, 16],
        [20, 30],
        [46, 30],
        [20, 43],
        [34, 43],
        [46, 43],
        [20, 55],
        [36, 55],
        [49, 55],
        [58, 42]
      ],
      "L"
    );
    scatter(map, [[14, 42], [23, 43], [53, 29], [38, 56], [55, 17]], "V");
    scatter(map, [[22, 15], [35, 29], [43, 15], [13, 55], [51, 43], [58, 56], [9, 42], [48, 28]], "N");

    for (let x = 0; x < map[0].length; x += 1) {
      put(map, x, 0, "!");
      put(map, x, map.length - 1, "!");
    }
    for (let y = 0; y < map.length; y += 1) {
      put(map, 0, y, "!");
      put(map, map[y].length - 1, y, "!");
    }

    return map.map((row) => row.join(""));
  }

  window.GameContent = {
    startRoom: "church",
    startPosition: { x: 9, y: 8 },
    startChapter: "prologue",
    openingDialogue: "wakeUp",
    tileSize: 32,
    objective: "离开教堂。",
    boundaryMessage: "此城市已封闭。",
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
      dailySupplies: {
        name: "生活用品",
        description: "从百货大楼买来的脸盆、毛巾和几件日用品。"
      }
    },
    flags: {
      spokeToElder: false,
      boughtSupplies: false,
      returnedToUniversity: false
    },
    chapterCards: {
      prologue: {
        title: "序章",
        lines: ["1999 年 12 月 31 日"],
        duration: 1700
      },
      chapterOne: {
        title: "第一章",
        lines: ["教堂外，是一座被警戒线封住的城市。先去百货大楼买生活用品，再回光明大学。"],
        duration: 1900
      }
    },
    rooms: {
      church: {
        name: "旧教堂",
        objective: "离开教堂。",
        ambient: "#10100f",
        floor: "#1a1916",
        wall: "#37322a",
        fog: "#070707",
        musicMood: "thin",
        lightRadius: 132,
        fogAlpha: 0.72,
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
            targetRoom: "city",
            targetSpawn: "churchGate",
            chapterCard: "chapterOne"
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
      },
      city: {
        name: "封闭城市",
        objective: [
          { flag: "returnedToUniversity", text: "第一幕完成。后续剧情待补。" },
          { flag: "boughtSupplies", text: "带着生活用品回光明大学。" },
          { text: "去百货大楼买生活用品。" }
        ],
        ambient: "#121615",
        floor: "#2c2b27",
        wall: "#443c31",
        fog: "#060807",
        musicMood: "low",
        lightRadius: 226,
        fogAlpha: 0.38,
        map: createCityMap(),
        spawnPoints: {
          churchGate: { x: 32, y: 39 }
        },
        labels: [
          { x: 5, y: 13, text: "人民公园", width: 5 },
          { x: 14, y: 11, text: "新华书店", width: 7 },
          { x: 27, y: 11, text: "录像厅", width: 5 },
          { x: 38, y: 11, text: "红星商场", width: 8 },
          { x: 53, y: 11, text: "国营饭店", width: 7 },
          { x: 7, y: 25, text: "粮油店", width: 6 },
          { x: 1, y: 33, text: "理发店", width: 4, vertical: true },
          { x: 10, y: 36, text: "邮局", width: 5 },
          { x: 52, y: 27, text: "光明大学", width: 8 },
          { x: 60, y: 30, text: "湘汇街", width: 3, vertical: true },
          { x: 51, y: 38, text: "中山诊所", width: 8 },
          { x: 9, y: 53, text: "百货大楼", width: 8 },
          { x: 22, y: 53, text: "和平电影院", width: 8 },
          { x: 39, y: 52, text: "游戏厅", width: 6 },
          { x: 51, y: 52, text: "大众茶馆", width: 8 }
        ],
        exits: [],
        interactables: [
          {
            id: "churchFront",
            x: 32,
            y: 33,
            label: "回望教堂",
            dialogue: "cityChurch"
          },
          {
            id: "bookstore",
            x: 17,
            y: 13,
            label: "查看新华书店",
            dialogue: "cityPlaceholder"
          },
          {
            id: "videoHall",
            x: 29,
            y: 13,
            label: "查看录像厅",
            dialogue: "cityPlaceholder"
          },
          {
            id: "market",
            x: 42,
            y: 13,
            label: "查看红星商场",
            dialogue: "cityPlaceholder"
          },
          {
            id: "departmentStore",
            x: 13,
            y: 56,
            label: "去百货大楼买生活用品",
            dialogue: "departmentStore"
          },
          {
            id: "university",
            x: 56,
            y: 29,
            label: "回光明大学",
            dialogue: "returnToUniversity",
            requiredFlag: "boughtSupplies",
            lockedDialogue: "schoolNeedSupplies",
            setFlag: "returnedToUniversity"
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
      },
      cityChurch: {
        speaker: "教堂",
        lines: [
          "门已经合上，里面没有钟声。",
          "城市像一张过于完整的地图，在你面前安静展开。",
          "你想起自己原本该做的事：去百货大楼买生活用品，然后回学校。"
        ],
        journal: "第一幕目标：去百货大楼买生活用品，然后回光明大学。",
        choices: [{ text: "离开", close: true }]
      },
      departmentStore: {
        speaker: "百货大楼",
        lines: [
          "柜台后的日光灯忽明忽暗，货架上整齐摆着脸盆、毛巾和搪瓷杯。",
          "售货员低着头写单，像没有看见你。"
        ],
        journal: "在百货大楼买到了生活用品。接下来该回光明大学。",
        choices: [{ text: "购买生活用品", close: true, giveItem: "dailySupplies", setFlag: "boughtSupplies" }]
      },
      schoolNeedSupplies: {
        speaker: "光明大学",
        lines: ["校门口的传达室亮着灯。你突然想起来，生活用品还没买。"],
        choices: [{ text: "先去百货大楼", close: true }]
      },
      returnToUniversity: {
        speaker: "光明大学",
        lines: [
          "你拎着刚买的生活用品回到校门口。",
          "传达室里没有人，登记簿却翻到了写着你名字的那一页。"
        ],
        journal: "第一幕完成：买到生活用品，并回到了光明大学。后续剧情待补。",
        choices: [{ text: "进入学校（占位）", close: true }]
      },
      cityPlaceholder: {
        speaker: "城市",
        lines: ["这里是第一章的占位区域。后续剧情、店铺和 NPC 可以继续补进来。"],
        choices: [{ text: "离开", close: true }]
      }
    }
  };
})();

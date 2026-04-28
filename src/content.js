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

  function scatter(map, points, glyph) {
    for (const [x, y] of points) put(map, x, y, glyph);
  }

  function addBuilding(map, x, y, width, height, signX, signY) {
    rect(map, x, y, width, height, "#");
    put(map, signX, signY, "S");
  }

  function createCityMap() {
    const map = createMap(54, 42);

    rect(map, 1, 1, 52, 2, "~");
    rect(map, 1, 39, 52, 2, "~");
    rect(map, 1, 29, 4, 11, "~");

    rect(map, 4, 12, 49, 3, "=");
    rect(map, 4, 25, 49, 3, "=");
    rect(map, 4, 34, 49, 3, "=");
    rect(map, 16, 3, 3, 36, "=");
    rect(map, 35, 3, 3, 36, "=");
    rect(map, 47, 3, 3, 36, "=");
    rect(map, 26, 1, 3, 11, "=");

    rect(map, 4, 5, 9, 6, ",");
    scatter(map, [[5, 6], [7, 5], [10, 6], [5, 9], [11, 9]], "Y");
    put(map, 8, 8, "Q");

    addBuilding(map, 6, 7, 8, 4, 10, 10);
    addBuilding(map, 22, 6, 7, 5, 25, 10);
    addBuilding(map, 32, 5, 9, 6, 36, 10);
    addBuilding(map, 43, 7, 8, 4, 47, 10);
    addBuilding(map, 6, 18, 8, 4, 10, 21);
    addBuilding(map, 42, 18, 8, 4, 46, 21);
    addBuilding(map, 7, 30, 9, 4, 11, 33);
    addBuilding(map, 22, 30, 10, 4, 27, 33);
    addBuilding(map, 39, 30, 10, 4, 44, 33);

    rect(map, 21, 16, 13, 9, ",");
    rect(map, 25, 17, 5, 6, "#");
    put(map, 27, 16, "O");
    put(map, 27, 23, "D");
    scatter(map, [[22, 17], [32, 17], [22, 23], [32, 23], [24, 24], [30, 24]], "Y");

    scatter(
      map,
      [
        [19, 13],
        [34, 13],
        [19, 26],
        [34, 26],
        [46, 13],
        [46, 26],
        [15, 34],
        [38, 34],
        [50, 34]
      ],
      "L"
    );
    scatter(map, [[12, 26], [31, 13], [44, 25], [29, 35]], "V");
    scatter(map, [[19, 12], [33, 25], [41, 13], [24, 35], [50, 28], [9, 35]], "N");

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
    items: {},
    flags: {
      spokeToElder: false
    },
    chapterCards: {
      prologue: {
        title: "序章",
        lines: ["1999 年 12 月 31 日"],
        duration: 1700
      },
      chapterOne: {
        title: "第一章",
        lines: ["教堂外，是一座被警戒线封住的城市。"],
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
        objective: "探索城市。后续剧情待补。",
        ambient: "#121615",
        floor: "#2c2b27",
        wall: "#443c31",
        fog: "#060807",
        musicMood: "low",
        lightRadius: 226,
        fogAlpha: 0.38,
        map: createCityMap(),
        spawnPoints: {
          churchGate: { x: 27, y: 24 }
        },
        exits: [],
        interactables: [
          {
            id: "churchFront",
            x: 27,
            y: 23,
            label: "回望教堂",
            dialogue: "cityChurch"
          },
          {
            id: "bookstore",
            x: 10,
            y: 10,
            label: "查看新华书店",
            dialogue: "cityPlaceholder"
          },
          {
            id: "videoHall",
            x: 25,
            y: 10,
            label: "查看录像厅",
            dialogue: "cityPlaceholder"
          },
          {
            id: "market",
            x: 36,
            y: 10,
            label: "查看红星商场",
            dialogue: "cityPlaceholder"
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
          "城市像一张过于完整的地图，在你面前安静展开。"
        ],
        choices: [{ text: "离开", close: true }]
      },
      cityPlaceholder: {
        speaker: "城市",
        lines: ["这里是第一章的占位区域。后续剧情、店铺和 NPC 可以继续补进来。"],
        choices: [{ text: "离开", close: true }]
      }
    }
  };
})();

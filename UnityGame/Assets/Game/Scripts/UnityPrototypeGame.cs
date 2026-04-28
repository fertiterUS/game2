using System.Collections.Generic;
using UnityEngine;

namespace OldChurchGame
{
    [ExecuteAlways]
    public sealed class UnityPrototypeGame : MonoBehaviour
    {
        private enum GameMode
        {
            MainMenu,
            ChapterCard,
            Church,
            City,
            Dormitory
        }

        private enum ChapterTarget
        {
            Church,
            City
        }

        private readonly struct Building
        {
            public readonly string Name;
            public readonly Rect Bounds;
            public readonly Color Body;
            public readonly Color Roof;
            public readonly bool Solid;

            public Building(string name, Rect bounds, Color body, Color roof, bool solid = true)
            {
                Name = name;
                Bounds = bounds;
                Body = body;
                Roof = roof;
                Solid = solid;
            }
        }

        private const float PlayerRadius = 0.34f;
        private const float InteractDistance = 1.8f;

        private static Sprite whiteSprite;
        private static Texture2D whiteTexture;

        private readonly List<Rect> blockers = new List<Rect>();
        private readonly List<Building> cityBuildings = new List<Building>();

        private Transform worldRoot;
        private Camera gameCamera;
        private GameMode mode = GameMode.MainMenu;
        private ChapterTarget chapterTarget = ChapterTarget.Church;
        private Vector2 playerPosition;
        private Vector2 elderPosition;
        private Vector2 churchDoorPosition;
        private Vector2 dormDoorPosition;
        private Rect cityBounds;
        private Rect departmentStoreEntrance;
        private Rect universityEntrance;
        private float chapterTimer;
        private string chapterTitle = "";
        private string objective = "";
        private string message = "";
        private float messageTimer;
        private bool churchDialogueComplete;
        private bool hasSupplies;
        private bool firstActComplete;
        private bool hauntedHouseTask;
        private int dialogueIndex = -1;
        private string[] activeDialogue;
        private GUIStyle titleStyle;
        private GUIStyle subtitleStyle;
        private GUIStyle panelStyle;
        private GUIStyle labelStyle;
        private GUIStyle buttonStyle;

        public void BuildEditorPreview()
        {
            EnsureCamera();
            EnsureWorldRoot();
            ClearWorld();
            mode = GameMode.City;
            hasSupplies = false;
            firstActComplete = false;
            hauntedHouseTask = false;
            playerPosition = new Vector2(0f, -5.7f);
            objective = "第一章 第一幕：去百货大楼买生活用品。";
            BuildCity();
            UpdatePlayerVisual();
            PositionCamera(true);
        }

        private void Awake()
        {
            EnsureCamera();
            EnsureWorldRoot();

            if (Application.isPlaying)
            {
                StartFromMenu();
            }
            else
            {
                BuildEditorPreview();
            }
        }

        private void OnEnable()
        {
            EnsureCamera();
            EnsureWorldRoot();

            if (!Application.isPlaying && worldRoot.childCount == 0)
            {
                BuildEditorPreview();
            }
        }

        private void Update()
        {
            if (!Application.isPlaying)
            {
                return;
            }

            UpdateMessageTimer();

            if (mode == GameMode.MainMenu)
            {
                if (Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.Space))
                {
                    BeginChapterCard("序章", ChapterTarget.Church);
                }

                return;
            }

            if (mode == GameMode.ChapterCard)
            {
                chapterTimer -= Time.deltaTime;
                if (chapterTimer <= 0f)
                {
                    if (chapterTarget == ChapterTarget.Church)
                    {
                        EnterChurch();
                    }
                    else
                    {
                        EnterCity();
                    }
                }

                return;
            }

            if (dialogueIndex >= 0)
            {
                if (PressedInteract())
                {
                    AdvanceDialogue();
                }

                return;
            }

            MovePlayer();
            HandleInteraction();
        }

        private void LateUpdate()
        {
            if (Application.isPlaying)
            {
                PositionCamera(false);
            }
        }

        private void OnGUI()
        {
            SetupGuiStyles();

            if (mode == GameMode.MainMenu)
            {
                DrawFullscreen(new Color(0.015f, 0.014f, 0.018f, 1f));
                GUI.Label(new Rect(0f, Screen.height * 0.24f, Screen.width, 72f), "旧教堂", titleStyle);
                GUI.Label(new Rect(0f, Screen.height * 0.35f, Screen.width, 36f), "1999 年 12 月 31 日", subtitleStyle);

                var buttonRect = CenteredRect(220f, 54f, 0.53f);
                if (GUI.Button(buttonRect, "开始游戏", buttonStyle))
                {
                    BeginChapterCard("序章", ChapterTarget.Church);
                }

                GUI.Label(new Rect(0f, Screen.height * 0.66f, Screen.width, 28f), "WASD 移动    E / 空格 互动", subtitleStyle);
                return;
            }

            if (mode == GameMode.ChapterCard)
            {
                DrawFullscreen(Color.black);
                GUI.Label(new Rect(0f, Screen.height * 0.44f, Screen.width, 70f), chapterTitle, titleStyle);
                return;
            }

            GUI.Box(new Rect(18f, 16f, Mathf.Min(650f, Screen.width - 36f), 74f), GUIContent.none, panelStyle);
            GUI.Label(new Rect(34f, 26f, Mathf.Min(620f, Screen.width - 68f), 26f), objective, labelStyle);
            GUI.Label(new Rect(34f, 54f, Mathf.Min(620f, Screen.width - 68f), 24f), "WASD / 方向键移动    E / 空格互动", labelStyle);

            if (!string.IsNullOrEmpty(message))
            {
                GUI.Box(new Rect(18f, Screen.height - 96f, Screen.width - 36f, 72f), GUIContent.none, panelStyle);
                GUI.Label(new Rect(34f, Screen.height - 76f, Screen.width - 68f, 40f), message, labelStyle);
            }

            if (dialogueIndex >= 0 && activeDialogue != null && dialogueIndex < activeDialogue.Length)
            {
                GUI.Box(new Rect(18f, Screen.height - 150f, Screen.width - 36f, 124f), GUIContent.none, panelStyle);
                GUI.Label(new Rect(40f, Screen.height - 126f, Screen.width - 80f, 64f), activeDialogue[dialogueIndex], labelStyle);
                GUI.Label(new Rect(40f, Screen.height - 58f, Screen.width - 80f, 26f), "按 E / 空格继续", labelStyle);
            }
        }

        private void StartFromMenu()
        {
            mode = GameMode.MainMenu;
            chapterTarget = ChapterTarget.Church;
            chapterTitle = "";
            chapterTimer = 0f;
            playerPosition = Vector2.zero;
            elderPosition = Vector2.zero;
            churchDialogueComplete = false;
            hasSupplies = false;
            firstActComplete = false;
            hauntedHouseTask = false;
            dialogueIndex = -1;
            activeDialogue = null;
            objective = "";
            message = "";
            messageTimer = 0f;
            ClearWorld();
            PositionCamera(true);
        }

        private void BeginChapterCard(string title, ChapterTarget target)
        {
            mode = GameMode.ChapterCard;
            chapterTitle = title;
            chapterTarget = target;
            chapterTimer = 2.1f;
            dialogueIndex = -1;
            activeDialogue = null;
            message = "";
            ClearWorld();
            PositionCamera(true);
        }

        private void EnterChurch()
        {
            mode = GameMode.Church;
            churchDialogueComplete = false;
            playerPosition = new Vector2(0f, -3.2f);
            elderPosition = new Vector2(0f, -1.1f);
            churchDoorPosition = new Vector2(0f, -4.85f);
            objective = "序章：和身边的老人交谈。";
            BuildChurch();
            ShowMessage("你在教堂冰冷的长椅旁醒来。", 3f);
            PositionCamera(true);
        }

        private void EnterCity()
        {
            mode = GameMode.City;
            playerPosition = new Vector2(0f, -5.7f);
            UpdateCityObjective();
            BuildCity();
            ShowMessage("门在身后合上，城市像一张旧照片一样展开。", 4f);
            PositionCamera(true);
        }

        private void EnterCityFromDormitory()
        {
            mode = GameMode.City;
            playerPosition = new Vector2(14f, -1.1f);
            UpdateCityObjective();
            BuildCity();
            ShowMessage("你从寝室楼回到校园门口。", 3f);
            PositionCamera(true);
        }

        private void EnterDormitory()
        {
            mode = GameMode.Dormitory;
            firstActComplete = true;
            playerPosition = new Vector2(0f, -3.85f);
            dormDoorPosition = new Vector2(0f, -4.85f);
            objective = "第一章 第二幕：接听寝室里的来电。";
            BuildDormitory();
            StartDialogue(new[]
            {
                "你推开 402 寝室的门，把刚买的生活用品放到床边。",
                "桌上的手机突然亮起来，铃声在空寝室里响得很急。",
                "屏幕上只有一个陌生名字：张超。",
                "张超：喂，林夏？我是张超，你室友。你回寝室了吧？",
                "张超：班里刚通知，学校今晚组织活动，地点是城南旧鬼屋。",
                "张超：集合时间和带队老师还没发，你先别走远。还有，别问我为什么是鬼屋，我也觉得不对劲。"
            }, () =>
            {
                hauntedHouseTask = true;
                objective = "第一章 第二幕：学校组织去城南旧鬼屋活动，后续剧情待定。";
                ShowMessage("手机通话结束。鬼屋活动任务已记录。", 4f);
            });
            PositionCamera(true);
        }

        private void UpdateCityObjective()
        {
            if (hauntedHouseTask)
            {
                objective = "第一章 第二幕：等待鬼屋活动集合信息。";
            }
            else if (hasSupplies)
            {
                objective = "第一章 第一幕：带着生活用品回光明大学寝室。";
            }
            else
            {
                objective = "第一章 第一幕：去百货大楼买生活用品。";
            }
        }

        private void BuildChurch()
        {
            EnsureWorldRoot();
            ClearWorld();
            blockers.Clear();

            AddRect("Church floor", new Rect(-5.5f, -5.25f, 11f, 10.5f), PaletteFloor(), 0);
            AddCheckerFloor(new Rect(-5f, -4.8f, 10f, 9.6f), new Color(0.23f, 0.22f, 0.22f), new Color(0.18f, 0.17f, 0.18f), 0.5f, 1);

            AddRect("North wall", new Rect(-5.6f, 4.8f, 11.2f, 0.45f), PaletteWall(), 10);
            AddRect("West wall", new Rect(-5.6f, -5.25f, 0.45f, 10.5f), PaletteWall(), 10);
            AddRect("East wall", new Rect(5.15f, -5.25f, 0.45f, 10.5f), PaletteWall(), 10);
            AddRect("South wall left", new Rect(-5.6f, -5.25f, 4.5f, 0.45f), PaletteWall(), 10);
            AddRect("South wall right", new Rect(1.1f, -5.25f, 4.5f, 0.45f), PaletteWall(), 10);
            AddRect("Door shadow", new Rect(-0.65f, -5.25f, 1.3f, 0.45f), new Color(0.06f, 0.045f, 0.035f), 11);

            blockers.Add(new Rect(-5.9f, 4.55f, 11.8f, 0.9f));
            blockers.Add(new Rect(-5.9f, -5.45f, 0.9f, 10.9f));
            blockers.Add(new Rect(5f, -5.45f, 0.9f, 10.9f));
            blockers.Add(new Rect(-5.9f, -5.45f, 4.85f, 0.9f));
            blockers.Add(new Rect(1.05f, -5.45f, 4.85f, 0.9f));

            AddRect("Altar", new Rect(-1.75f, 2.85f, 3.5f, 0.75f), new Color(0.34f, 0.28f, 0.2f), 20);
            AddRect("Cross vertical", new Rect(-0.08f, 3.35f, 0.16f, 1.2f), new Color(0.54f, 0.39f, 0.2f), 21);
            AddRect("Cross horizontal", new Rect(-0.45f, 3.85f, 0.9f, 0.16f), new Color(0.54f, 0.39f, 0.2f), 21);
            blockers.Add(new Rect(-1.9f, 2.7f, 3.8f, 0.95f));

            for (var row = 0; row < 4; row++)
            {
                var y = 1.3f - row * 1.25f;
                AddRect("Left pew " + row, new Rect(-4.25f, y, 2.7f, 0.35f), PaletteWood(), 15);
                AddRect("Right pew " + row, new Rect(1.55f, y, 2.7f, 0.35f), PaletteWood(), 15);
                blockers.Add(new Rect(-4.4f, y - 0.08f, 3f, 0.52f));
                blockers.Add(new Rect(1.4f, y - 0.08f, 3f, 0.52f));
            }

            AddCharacter("Elder", elderPosition, new Color(0.54f, 0.52f, 0.45f), new Color(0.8f, 0.74f, 0.62f), 50);
            AddPlayer();
        }

        private void BuildCity()
        {
            EnsureWorldRoot();
            ClearWorld();
            blockers.Clear();
            cityBuildings.Clear();
            cityBounds = new Rect(-20f, -16f, 40f, 32f);
            departmentStoreEntrance = new Rect(-14.2f, -13.6f, 5.5f, 1.4f);
            universityEntrance = new Rect(11.2f, -0.3f, 5.6f, 1.5f);

            AddRect("City grass", cityBounds, new Color(0.1f, 0.18f, 0.1f), -10);
            AddWaterAndEmbankments();
            AddRoads();
            AddParksAndDetails();

            AddCityBuilding(new Building("新华书店", new Rect(-13.7f, 9.2f, 5.5f, 3.3f), new Color(0.39f, 0.31f, 0.22f), new Color(0.2f, 0.16f, 0.14f)));
            AddCityBuilding(new Building("录像厅", new Rect(-4.4f, 9.2f, 3.8f, 3.5f), new Color(0.28f, 0.29f, 0.3f), new Color(0.13f, 0.13f, 0.14f)));
            AddCityBuilding(new Building("红星商场", new Rect(2.7f, 9f, 6.1f, 4.6f), new Color(0.42f, 0.37f, 0.3f), new Color(0.18f, 0.18f, 0.17f)));
            AddCityBuilding(new Building("国营饭店", new Rect(12.4f, 9.2f, 5.6f, 3.9f), new Color(0.37f, 0.33f, 0.26f), new Color(0.16f, 0.15f, 0.13f)));
            AddCityBuilding(new Building("粮油店", new Rect(-18.3f, 1.2f, 4.3f, 3.2f), new Color(0.41f, 0.32f, 0.2f), new Color(0.2f, 0.17f, 0.13f)));
            AddCityBuilding(new Building("邮局", new Rect(-14.6f, -5.1f, 5.8f, 3.7f), new Color(0.24f, 0.36f, 0.3f), new Color(0.16f, 0.14f, 0.11f)));
            AddCityBuilding(new Building("百货大楼", new Rect(-15.6f, -13.3f, 7.1f, 4.5f), new Color(0.49f, 0.37f, 0.22f), new Color(0.18f, 0.16f, 0.12f)));
            AddCityBuilding(new Building("和平电影院", new Rect(-5.8f, -13.2f, 6.1f, 4.5f), new Color(0.35f, 0.27f, 0.2f), new Color(0.15f, 0.13f, 0.11f)));
            AddCityBuilding(new Building("游戏厅", new Rect(2f, -13f, 4.6f, 4.2f), new Color(0.29f, 0.42f, 0.38f), new Color(0.16f, 0.15f, 0.14f)));
            AddCityBuilding(new Building("大众茶馆", new Rect(10.4f, -13f, 6.2f, 4.3f), new Color(0.36f, 0.31f, 0.21f), new Color(0.13f, 0.12f, 0.11f)));
            AddCityBuilding(new Building("光明大学", new Rect(10.6f, 0.2f, 6.3f, 4.3f), new Color(0.28f, 0.36f, 0.39f), new Color(0.12f, 0.12f, 0.13f)));
            AddCityBuilding(new Building("中山药局", new Rect(10.8f, -5.8f, 6.2f, 3.6f), new Color(0.28f, 0.28f, 0.22f), new Color(0.14f, 0.13f, 0.12f)));
            AddCityBuilding(new Building("理发店", new Rect(-20f, -5.1f, 2.1f, 4.1f), new Color(0.24f, 0.34f, 0.38f), new Color(0.13f, 0.13f, 0.13f)));

            AddCentralChurch();
            AddWarningTape();
            AddStreetProps();
            AddNpcCrowd();
            AddPlayer();
        }

        private void BuildDormitory()
        {
            EnsureWorldRoot();
            ClearWorld();
            blockers.Clear();

            AddRect("Dorm floor", new Rect(-5.8f, -5.25f, 11.6f, 10.5f), new Color(0.16f, 0.14f, 0.12f), 0);
            AddCheckerFloor(new Rect(-5.3f, -4.85f, 10.6f, 9.7f), new Color(0.24f, 0.2f, 0.16f), new Color(0.2f, 0.17f, 0.14f), 0.55f, 1);

            AddRect("Dorm north wall", new Rect(-5.9f, 4.85f, 11.8f, 0.45f), PaletteWall(), 10);
            AddRect("Dorm west wall", new Rect(-5.9f, -5.25f, 0.45f, 10.5f), PaletteWall(), 10);
            AddRect("Dorm east wall", new Rect(5.45f, -5.25f, 0.45f, 10.5f), PaletteWall(), 10);
            AddRect("Dorm south wall left", new Rect(-5.9f, -5.25f, 4.8f, 0.45f), PaletteWall(), 10);
            AddRect("Dorm south wall right", new Rect(1.1f, -5.25f, 4.8f, 0.45f), PaletteWall(), 10);
            AddRect("Dorm door shadow", new Rect(-0.65f, -5.25f, 1.3f, 0.45f), new Color(0.06f, 0.045f, 0.035f), 11);

            blockers.Add(new Rect(-6.15f, 4.55f, 12.3f, 0.9f));
            blockers.Add(new Rect(-6.15f, -5.45f, 0.9f, 10.9f));
            blockers.Add(new Rect(5.25f, -5.45f, 0.9f, 10.9f));
            blockers.Add(new Rect(-6.15f, -5.45f, 5.1f, 0.9f));
            blockers.Add(new Rect(1.05f, -5.45f, 5.1f, 0.9f));

            AddDormBed("Left upper bed", new Vector2(-3.7f, 2.8f));
            AddDormBed("Left lower bed", new Vector2(-3.7f, 0.9f));
            AddDormBed("Right upper bed", new Vector2(3.7f, 2.8f));
            AddDormBed("Right lower bed", new Vector2(3.7f, 0.9f));

            AddRect("Desk", new Rect(-1.55f, -0.55f, 3.1f, 1.05f), PaletteWood(), 18);
            AddRect("Phone body", new Rect(-0.35f, -0.16f, 0.7f, 0.36f), new Color(0.05f, 0.06f, 0.07f), 25);
            AddRect("Phone screen", new Rect(-0.24f, -0.08f, 0.48f, 0.2f), new Color(0.32f, 0.72f, 0.62f), 26);
            AddLabel("手机", new Vector2(0f, 0.72f), 1.8f, new Color(0.72f, 0.64f, 0.46f), Color.clear, 35);

            AddRect("Wardrobe left", new Rect(-5.05f, -2.1f, 1.2f, 1.9f), new Color(0.25f, 0.2f, 0.16f), 18);
            AddRect("Wardrobe right", new Rect(3.85f, -2.1f, 1.2f, 1.9f), new Color(0.25f, 0.2f, 0.16f), 18);
            AddRect("Supplies basin", new Rect(-4.1f, -3.65f, 1.1f, 0.46f), new Color(0.52f, 0.62f, 0.6f), 20);
            AddLabel("寝室 402", new Vector2(0f, 4.1f), 3.4f, new Color(0.7f, 0.64f, 0.49f), Color.clear, 35);

            blockers.Add(new Rect(-4.8f, 0.45f, 2.2f, 3.25f));
            blockers.Add(new Rect(2.6f, 0.45f, 2.2f, 3.25f));
            blockers.Add(new Rect(-1.7f, -0.7f, 3.4f, 1.35f));
            blockers.Add(new Rect(-5.25f, -2.3f, 1.55f, 2.25f));
            blockers.Add(new Rect(3.7f, -2.3f, 1.55f, 2.25f));

            AddPlayer();
        }

        private void AddDormBed(string name, Vector2 center)
        {
            AddRect(name + " frame", new Rect(center.x - 1.05f, center.y - 0.45f, 2.1f, 0.9f), new Color(0.37f, 0.28f, 0.21f), 17);
            AddRect(name + " blanket", new Rect(center.x - 0.82f, center.y - 0.28f, 1.64f, 0.58f), new Color(0.52f, 0.48f, 0.39f), 19);
            AddRect(name + " pillow", new Rect(center.x - 0.78f, center.y + 0.16f, 0.55f, 0.24f), new Color(0.78f, 0.72f, 0.58f), 20);
        }

        private void AddWaterAndEmbankments()
        {
            AddRect("North river", new Rect(-20f, 14.3f, 40f, 1.5f), new Color(0.08f, 0.18f, 0.24f), -5);
            AddRect("West river", new Rect(-20f, -15.8f, 2.1f, 30.1f), new Color(0.08f, 0.18f, 0.24f), -5);
            AddRect("North embankment", new Rect(-20f, 13.55f, 40f, 0.8f), new Color(0.26f, 0.25f, 0.22f), 3);
            AddRect("West embankment", new Rect(-17.9f, -15.8f, 0.8f, 30.1f), new Color(0.26f, 0.25f, 0.22f), 3);

            for (var i = 0; i < 36; i++)
            {
                var x = -19.5f + i * 1.1f;
                AddRect("River sparkle " + i, new Rect(x, 14.95f + Mathf.Sin(i) * 0.15f, 0.28f, 0.07f), new Color(0.4f, 0.61f, 0.67f, 0.75f), 4);
            }
        }

        private void AddRoads()
        {
            var road = new Color(0.36f, 0.35f, 0.32f);
            var roadDark = new Color(0.26f, 0.25f, 0.23f);
            AddRect("Top road", new Rect(-20f, 5.6f, 40f, 2.4f), road, -2);
            AddRect("Center road", new Rect(-20f, -2.2f, 40f, 2.5f), road, -2);
            AddRect("Bottom road", new Rect(-20f, -8.2f, 40f, 2.4f), road, -2);
            AddRect("Left vertical road", new Rect(-7.2f, -16f, 2.5f, 29.6f), road, -2);
            AddRect("Center vertical road", new Rect(0.4f, -16f, 2.3f, 29.6f), road, -2);
            AddRect("Right vertical road", new Rect(7.8f, -16f, 2.4f, 29.6f), road, -2);
            AddRect("North bridge", new Rect(-1.05f, 13.6f, 2.1f, 2.4f), road, -1);

            for (var x = -19.5f; x <= 19f; x += 1f)
            {
                AddRect("Road seam top " + x, new Rect(x, 6.72f, 0.06f, 0.12f), roadDark, 2);
                AddRect("Road seam center " + x, new Rect(x, -1.02f, 0.06f, 0.12f), roadDark, 2);
                AddRect("Road seam bottom " + x, new Rect(x, -7.04f, 0.06f, 0.12f), roadDark, 2);
            }

            for (var y = -15.5f; y <= 13f; y += 1f)
            {
                AddRect("Road seam v1 " + y, new Rect(-6.0f, y, 0.12f, 0.06f), roadDark, 2);
                AddRect("Road seam v2 " + y, new Rect(1.55f, y, 0.12f, 0.06f), roadDark, 2);
                AddRect("Road seam v3 " + y, new Rect(9.0f, y, 0.12f, 0.06f), roadDark, 2);
            }
        }

        private void AddParksAndDetails()
        {
            AddRect("People park", new Rect(-19f, 8.2f, 7.5f, 5.3f), new Color(0.12f, 0.27f, 0.12f), 0);
            AddLabel("人民公园", new Vector2(-15.2f, 8.65f), 4.2f, new Color(0.13f, 0.12f, 0.1f), new Color(0.7f, 0.64f, 0.48f), 30);
            AddRect("Park pavilion roof", new Rect(-16.9f, 10.9f, 2.2f, 0.8f), new Color(0.08f, 0.29f, 0.18f), 20);
            AddRect("Park pavilion", new Rect(-16.6f, 10.2f, 1.6f, 0.8f), new Color(0.44f, 0.24f, 0.16f), 18);

            for (var i = 0; i < 34; i++)
            {
                var x = -19.2f + (i * 2.23f % 38.2f);
                var y = -15f + (i * 4.13f % 28f);
                if (IsOnRoad(new Vector2(x, y)) || Mathf.Abs(x) < 4.1f && y > -5f && y < 5.2f)
                {
                    continue;
                }

                AddTree(new Vector2(x, y), 18);
            }
        }

        private void AddCityBuilding(Building building)
        {
            cityBuildings.Add(building);
            AddRect(building.Name + " body", building.Bounds, building.Body, 12);
            AddRect(building.Name + " roof", new Rect(building.Bounds.xMin - 0.12f, building.Bounds.yMax - 0.65f, building.Bounds.width + 0.24f, 0.8f), building.Roof, 16);
            AddRect(building.Name + " sign", new Rect(building.Bounds.center.x - building.Bounds.width * 0.35f, building.Bounds.center.y + 0.25f, building.Bounds.width * 0.7f, 0.65f), new Color(0.32f, 0.16f, 0.1f), 20);
            AddLabel(building.Name, building.Bounds.center + new Vector2(0f, 0.56f), building.Bounds.width * 0.75f, new Color(0.72f, 0.58f, 0.34f), Color.clear, 35);

            for (var i = 0; i < Mathf.Max(2, Mathf.RoundToInt(building.Bounds.width)); i++)
            {
                var x = building.Bounds.xMin + 0.7f + i * 1.1f;
                if (x > building.Bounds.xMax - 0.55f)
                {
                    break;
                }

                AddRect(building.Name + " window " + i, new Rect(x, building.Bounds.yMin + 0.9f, 0.45f, 0.5f), new Color(0.08f, 0.15f, 0.18f), 21);
            }

            AddRect(building.Name + " door", new Rect(building.Bounds.center.x - 0.36f, building.Bounds.yMin, 0.72f, 0.95f), new Color(0.12f, 0.08f, 0.05f), 22);

            if (building.Solid)
            {
                blockers.Add(new Rect(building.Bounds.xMin - 0.2f, building.Bounds.yMin - 0.1f, building.Bounds.width + 0.4f, building.Bounds.height + 0.25f));
            }
        }

        private void AddCentralChurch()
        {
            var fence = new Color(0.52f, 0.5f, 0.43f);
            AddRect("Church garden", new Rect(-4.8f, -4.3f, 9.6f, 9f), new Color(0.11f, 0.26f, 0.11f), 0);
            AddRect("Church fence top", new Rect(-5f, 4.55f, 10f, 0.25f), fence, 25);
            AddRect("Church fence left", new Rect(-5f, -4.55f, 0.25f, 9.1f), fence, 25);
            AddRect("Church fence right", new Rect(4.75f, -4.55f, 0.25f, 9.1f), fence, 25);
            AddRect("Church fence bottom left", new Rect(-5f, -4.55f, 3.85f, 0.25f), fence, 25);
            AddRect("Church fence bottom right", new Rect(1.15f, -4.55f, 3.85f, 0.25f), fence, 25);

            AddRect("Church body", new Rect(-2.1f, -1.75f, 4.2f, 4.9f), new Color(0.46f, 0.45f, 0.41f), 30);
            AddRect("Church nave left", new Rect(-3.35f, -0.9f, 1.3f, 2.8f), new Color(0.38f, 0.37f, 0.34f), 29);
            AddRect("Church nave right", new Rect(2.05f, -0.9f, 1.3f, 2.8f), new Color(0.38f, 0.37f, 0.34f), 29);
            AddRect("Church roof", new Rect(-2.35f, 2.55f, 4.7f, 1.2f), new Color(0.5f, 0.18f, 0.1f), 34);
            AddRect("Church tower", new Rect(-0.85f, 1.5f, 1.7f, 3.9f), new Color(0.52f, 0.5f, 0.45f), 35);
            AddRect("Church steeple", new Rect(-0.55f, 4.95f, 1.1f, 1.9f), new Color(0.58f, 0.22f, 0.12f), 36);
            AddRect("Church cross", new Rect(-0.07f, 6.52f, 0.14f, 1f), new Color(0.58f, 0.42f, 0.2f), 38);
            AddRect("Church crossbar", new Rect(-0.36f, 6.91f, 0.72f, 0.12f), new Color(0.58f, 0.42f, 0.2f), 38);
            AddRect("Church door", new Rect(-0.45f, -1.75f, 0.9f, 1.05f), new Color(0.1f, 0.07f, 0.05f), 40);
            AddLabel("旧教堂", new Vector2(0f, -2.45f), 3.6f, new Color(0.7f, 0.64f, 0.49f), Color.clear, 45);

            blockers.Add(new Rect(-3.6f, -2.05f, 7.2f, 8.55f));
        }

        private void AddWarningTape()
        {
            var tape = new Color(0.86f, 0.72f, 0.16f);
            var dark = new Color(0.12f, 0.11f, 0.09f);
            AddRect("Warning border top", new Rect(cityBounds.xMin, cityBounds.yMax - 0.35f, cityBounds.width, 0.35f), tape, 60);
            AddRect("Warning border bottom", new Rect(cityBounds.xMin, cityBounds.yMin, cityBounds.width, 0.35f), tape, 60);
            AddRect("Warning border left", new Rect(cityBounds.xMin, cityBounds.yMin, 0.35f, cityBounds.height), tape, 60);
            AddRect("Warning border right", new Rect(cityBounds.xMax - 0.35f, cityBounds.yMin, 0.35f, cityBounds.height), tape, 60);

            for (var i = 0; i < 34; i++)
            {
                AddRect("Tape mark top " + i, new Rect(cityBounds.xMin + i * 1.2f, cityBounds.yMax - 0.35f, 0.55f, 0.35f), dark, 61);
                AddRect("Tape mark bottom " + i, new Rect(cityBounds.xMin + i * 1.2f + 0.4f, cityBounds.yMin, 0.55f, 0.35f), dark, 61);
            }

            for (var i = 0; i < 27; i++)
            {
                AddRect("Tape mark left " + i, new Rect(cityBounds.xMin, cityBounds.yMin + i * 1.2f, 0.35f, 0.55f), dark, 61);
                AddRect("Tape mark right " + i, new Rect(cityBounds.xMax - 0.35f, cityBounds.yMin + i * 1.2f + 0.4f, 0.35f, 0.55f), dark, 61);
            }
        }

        private void AddStreetProps()
        {
            for (var x = -16f; x <= 16f; x += 8f)
            {
                AddLamp(new Vector2(x, 4.6f));
                AddLamp(new Vector2(x + 3f, -3.4f));
                AddLamp(new Vector2(x, -9.4f));
            }

            AddRect("Blue van", new Rect(-5.2f, -8.05f, 1.5f, 0.75f), new Color(0.19f, 0.35f, 0.49f), 45);
            AddRect("Small red car", new Rect(7.9f, -13.8f, 1.25f, 0.58f), new Color(0.62f, 0.17f, 0.12f), 45);
            AddRect("Yellow cart", new Rect(10.5f, 5.2f, 0.9f, 0.6f), new Color(0.56f, 0.46f, 0.22f), 45);
        }

        private void AddNpcCrowd()
        {
            var points = new[]
            {
                new Vector2(-12.2f, 5.0f), new Vector2(-7.6f, 4.7f), new Vector2(-2.2f, 5.7f),
                new Vector2(5.8f, 5.2f), new Vector2(13.4f, 5.5f), new Vector2(-17.5f, -1.1f),
                new Vector2(-12.7f, -8.0f), new Vector2(-1.0f, -4.5f), new Vector2(6.6f, -2.9f),
                new Vector2(13.6f, -7.7f), new Vector2(17.2f, -13.9f), new Vector2(-6.9f, -13.4f),
                new Vector2(1.3f, -6.6f), new Vector2(9.0f, 0.9f), new Vector2(-18.0f, -10.9f)
            };

            for (var i = 0; i < points.Length; i++)
            {
                var coat = Color.Lerp(new Color(0.12f, 0.22f, 0.28f), new Color(0.48f, 0.22f, 0.13f), (i % 5) / 4f);
                AddCharacter("Pedestrian " + i, points[i], coat, new Color(0.71f, 0.56f, 0.42f), 50);
            }
        }

        private void AddLamp(Vector2 position)
        {
            AddRect("Lamp pole", new Rect(position.x - 0.06f, position.y - 0.55f, 0.12f, 1.1f), new Color(0.08f, 0.08f, 0.08f), 42);
            AddRect("Lamp head", new Rect(position.x - 0.22f, position.y + 0.4f, 0.44f, 0.18f), new Color(0.58f, 0.5f, 0.26f), 43);
        }

        private void AddTree(Vector2 position, int order)
        {
            AddRect("Tree trunk", new Rect(position.x - 0.11f, position.y - 0.4f, 0.22f, 0.55f), new Color(0.21f, 0.12f, 0.06f), order);
            AddRect("Tree crown", new Rect(position.x - 0.55f, position.y - 0.1f, 1.1f, 0.9f), new Color(0.07f, 0.28f, 0.09f), order + 1);
            AddRect("Tree crown dark", new Rect(position.x - 0.35f, position.y + 0.05f, 0.75f, 0.55f), new Color(0.04f, 0.2f, 0.07f), order + 2);
        }

        private void AddCheckerFloor(Rect bounds, Color a, Color b, float tileSize, int order)
        {
            var columns = Mathf.CeilToInt(bounds.width / tileSize);
            var rows = Mathf.CeilToInt(bounds.height / tileSize);
            for (var row = 0; row < rows; row++)
            {
                for (var column = 0; column < columns; column++)
                {
                    var color = (row + column) % 2 == 0 ? a : b;
                    AddRect("Floor tile", new Rect(bounds.xMin + column * tileSize, bounds.yMin + row * tileSize, tileSize, tileSize), color, order);
                }
            }
        }

        private void MovePlayer()
        {
            var input = Vector2.zero;
            if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow))
            {
                input.x -= 1f;
            }

            if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow))
            {
                input.x += 1f;
            }

            if (Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow))
            {
                input.y -= 1f;
            }

            if (Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow))
            {
                input.y += 1f;
            }

            if (input.sqrMagnitude <= 0.001f)
            {
                return;
            }

            input.Normalize();
            var delta = input * (mode == GameMode.City ? 4.1f : 3.25f) * Time.deltaTime;
            TryMove(new Vector2(delta.x, 0f));
            TryMove(new Vector2(0f, delta.y));
            UpdatePlayerVisual();
        }

        private void TryMove(Vector2 delta)
        {
            var candidate = playerPosition + delta;

            if (mode == GameMode.City)
            {
                if (candidate.x < cityBounds.xMin + PlayerRadius || candidate.x > cityBounds.xMax - PlayerRadius ||
                    candidate.y < cityBounds.yMin + PlayerRadius || candidate.y > cityBounds.yMax - PlayerRadius)
                {
                    ShowMessage("此城市已封闭。", 1.7f);
                    candidate.x = Mathf.Clamp(candidate.x, cityBounds.xMin + PlayerRadius, cityBounds.xMax - PlayerRadius);
                    candidate.y = Mathf.Clamp(candidate.y, cityBounds.yMin + PlayerRadius, cityBounds.yMax - PlayerRadius);
                }
            }

            if (Collides(candidate))
            {
                return;
            }

            playerPosition = candidate;
        }

        private bool Collides(Vector2 point)
        {
            for (var i = 0; i < blockers.Count; i++)
            {
                var expanded = Expand(blockers[i], PlayerRadius);
                if (expanded.Contains(point))
                {
                    return true;
                }
            }

            return false;
        }

        private void HandleInteraction()
        {
            if (mode == GameMode.Church)
            {
                if (Vector2.Distance(playerPosition, elderPosition) <= InteractDistance)
                {
                    if (!churchDialogueComplete)
                    {
                        ShowMessage("按 E / 空格和老人交谈。", 0.1f);
                    }

                    if (PressedInteract())
                    {
                        if (churchDialogueComplete)
                        {
                            ShowMessage("老人沉默地看着门口。", 2f);
                        }
                        else
                        {
                            StartDialogue(new[]
                            {
                                "老人：你终于醒了。这里是旧教堂。",
                                "主角：现在是什么时候？",
                                "老人：1999 年 12 月 31 日。城里的钟已经停了一整天。",
                                "老人：先离开这里吧。门外的路还亮着。"
                            }, () =>
                            {
                                churchDialogueComplete = true;
                                objective = "序章：走出教堂。";
                                ShowMessage("教堂的门缝里吹进一阵冷风。", 3f);
                            });
                        }
                    }
                }

                if (Vector2.Distance(playerPosition, churchDoorPosition) <= 1f && playerPosition.y < -4.25f)
                {
                    if (churchDialogueComplete)
                    {
                        BeginChapterCard("第一章", ChapterTarget.City);
                    }
                    else
                    {
                        ShowMessage("先和老人说话。", 2f);
                        playerPosition.y = -4.1f;
                        UpdatePlayerVisual();
                    }
                }

                return;
            }

            if (mode == GameMode.City)
            {
                if (departmentStoreEntrance.Contains(playerPosition))
                {
                    ShowMessage("按 E / 空格进入百货大楼。", 0.1f);
                    if (PressedInteract())
                    {
                        if (hasSupplies)
                        {
                            ShowMessage("生活用品已经买好，该回光明大学寝室了。", 3f);
                        }
                        else
                        {
                            hasSupplies = true;
                            UpdateCityObjective();
                            ShowMessage("你在百货大楼买到了生活用品。塑料袋勒得手指发冷。", 4f);
                        }
                    }
                }
                else if (universityEntrance.Contains(playerPosition))
                {
                    ShowMessage("按 E / 空格进入光明大学寝室。", 0.1f);
                    if (PressedInteract())
                    {
                        if (hasSupplies)
                        {
                            EnterDormitory();
                        }
                        else
                        {
                            ShowMessage("主角：还是先去百货大楼买生活用品吧。", 3f);
                        }
                    }
                }
                else if (PressedInteract())
                {
                    if (hauntedHouseTask)
                    {
                        ShowMessage("当前任务：等待鬼屋活动集合信息。", 2f);
                    }
                    else
                    {
                        ShowMessage(hasSupplies ? "生活用品已经买好，该回学校寝室了。" : "当前任务：去百货大楼买生活用品。", 2f);
                    }
                }

                return;
            }

            if (mode == GameMode.Dormitory)
            {
                if (Vector2.Distance(playerPosition, dormDoorPosition) <= 1.1f && playerPosition.y < -4.2f)
                {
                    ShowMessage("按 E / 空格离开寝室。", 0.1f);
                    if (PressedInteract())
                    {
                        EnterCityFromDormitory();
                    }

                    return;
                }

                if (PressedInteract())
                {
                    ShowMessage(hauntedHouseTask ? "手机里记录着张超的来电：城南旧鬼屋活动，后续待定。" : "手机还在桌上响。", 2.5f);
                }
            }
        }

        private void StartDialogue(string[] lines, System.Action onComplete)
        {
            activeDialogue = lines;
            dialogueIndex = 0;
            dialogueComplete = onComplete;
            message = "";
        }

        private System.Action dialogueComplete;

        private void AdvanceDialogue()
        {
            dialogueIndex++;
            if (activeDialogue == null || dialogueIndex < activeDialogue.Length)
            {
                return;
            }

            dialogueIndex = -1;
            activeDialogue = null;
            var complete = dialogueComplete;
            dialogueComplete = null;
            complete?.Invoke();
        }

        private bool PressedInteract()
        {
            return Input.GetKeyDown(KeyCode.E) || Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.Return);
        }

        private void UpdateMessageTimer()
        {
            if (messageTimer <= 0f)
            {
                return;
            }

            messageTimer -= Time.deltaTime;
            if (messageTimer <= 0f)
            {
                message = "";
            }
        }

        private void ShowMessage(string text, float seconds)
        {
            message = text;
            messageTimer = seconds;
        }

        private void AddPlayer()
        {
            AddCharacter("Player", playerPosition, new Color(0.14f, 0.22f, 0.37f), new Color(0.76f, 0.58f, 0.42f), 70);
            AddRect("Player focus", new Rect(playerPosition.x - 0.39f, playerPosition.y - 0.55f, 0.78f, 0.13f), new Color(0.02f, 0.02f, 0.02f, 0.55f), 69);
        }

        private void AddCharacter(string name, Vector2 position, Color coat, Color skin, int order)
        {
            AddRect(name + " shadow", new Rect(position.x - 0.32f, position.y - 0.46f, 0.64f, 0.16f), new Color(0.02f, 0.02f, 0.02f, 0.35f), order - 1);
            AddRect(name + " body", new Rect(position.x - 0.24f, position.y - 0.34f, 0.48f, 0.58f), coat, order);
            AddRect(name + " head", new Rect(position.x - 0.2f, position.y + 0.16f, 0.4f, 0.34f), skin, order + 1);
            AddRect(name + " hair", new Rect(position.x - 0.2f, position.y + 0.38f, 0.4f, 0.13f), new Color(0.04f, 0.03f, 0.025f), order + 2);
        }

        private void UpdatePlayerVisual()
        {
            var player = worldRoot != null ? worldRoot.Find("Player body") : null;
            if (player == null)
            {
                AddPlayer();
                return;
            }

            MoveNamed("Player shadow", new Rect(playerPosition.x - 0.32f, playerPosition.y - 0.46f, 0.64f, 0.16f));
            MoveNamed("Player body", new Rect(playerPosition.x - 0.24f, playerPosition.y - 0.34f, 0.48f, 0.58f));
            MoveNamed("Player head", new Rect(playerPosition.x - 0.2f, playerPosition.y + 0.16f, 0.4f, 0.34f));
            MoveNamed("Player hair", new Rect(playerPosition.x - 0.2f, playerPosition.y + 0.38f, 0.4f, 0.13f));
            MoveNamed("Player focus", new Rect(playerPosition.x - 0.39f, playerPosition.y - 0.55f, 0.78f, 0.13f));
        }

        private void MoveNamed(string objectName, Rect rect)
        {
            var child = worldRoot.Find(objectName);
            if (child == null)
            {
                return;
            }

            child.localPosition = new Vector3(rect.center.x, rect.center.y, child.localPosition.z);
            child.localScale = new Vector3(rect.width, rect.height, 1f);
        }

        private void AddRect(string objectName, Rect rect, Color color, int order)
        {
            EnsureWorldRoot();
            EnsureSprite();

            var child = new GameObject(objectName);
            child.transform.SetParent(worldRoot, false);
            child.transform.localPosition = new Vector3(rect.center.x, rect.center.y, order * -0.01f);
            child.transform.localScale = new Vector3(rect.width, rect.height, 1f);

            var renderer = child.AddComponent<SpriteRenderer>();
            renderer.sprite = whiteSprite;
            renderer.color = color;
            renderer.sortingOrder = order;
        }

        private void AddLabel(string text, Vector2 position, float width, Color textColor, Color plateColor, int order)
        {
            if (plateColor.a > 0f)
            {
                AddRect(text + " label plate", new Rect(position.x - width * 0.5f, position.y - 0.32f, width, 0.64f), plateColor, order - 1);
            }

            var label = new GameObject(text + " label");
            label.transform.SetParent(worldRoot, false);
            label.transform.localPosition = new Vector3(position.x, position.y - 0.18f, order * -0.01f);
            label.transform.localScale = Vector3.one;

            var mesh = label.AddComponent<TextMesh>();
            mesh.text = text;
            mesh.anchor = TextAnchor.MiddleCenter;
            mesh.alignment = TextAlignment.Center;
            mesh.fontSize = 42;
            mesh.characterSize = Mathf.Clamp(width / Mathf.Max(6f, text.Length * 6f), 0.13f, 0.22f);
            mesh.color = textColor;

            var renderer = label.GetComponent<MeshRenderer>();
            if (renderer != null)
            {
                renderer.sortingOrder = order;
            }
        }

        private void ClearWorld()
        {
            if (worldRoot == null)
            {
                return;
            }

            for (var i = worldRoot.childCount - 1; i >= 0; i--)
            {
                var child = worldRoot.GetChild(i).gameObject;
                if (Application.isPlaying)
                {
                    Destroy(child);
                }
                else
                {
                    DestroyImmediate(child);
                }
            }
        }

        private void EnsureWorldRoot()
        {
            if (worldRoot != null)
            {
                return;
            }

            var found = transform.Find("Generated World");
            if (found != null)
            {
                worldRoot = found;
                return;
            }

            var root = new GameObject("Generated World");
            root.transform.SetParent(transform, false);
            worldRoot = root.transform;
        }

        private void EnsureCamera()
        {
            if (gameCamera != null)
            {
                return;
            }

            gameCamera = Camera.main;
            if (gameCamera == null)
            {
                var cameraObject = new GameObject("Main Camera");
                gameCamera = cameraObject.AddComponent<Camera>();
                cameraObject.tag = "MainCamera";
            }

            gameCamera.orthographic = true;
            gameCamera.orthographicSize = 7.5f;
            gameCamera.clearFlags = CameraClearFlags.SolidColor;
            gameCamera.backgroundColor = new Color(0.02f, 0.02f, 0.025f);
            gameCamera.transform.rotation = Quaternion.identity;
        }

        private void PositionCamera(bool snap)
        {
            EnsureCamera();

            Vector3 target;
            if (mode == GameMode.City)
            {
                target = new Vector3(playerPosition.x, playerPosition.y, -10f);
            }
            else if (mode == GameMode.Church)
            {
                target = new Vector3(0f, 0f, -10f);
            }
            else
            {
                target = new Vector3(0f, 0f, -10f);
            }

            gameCamera.transform.position = snap ? target : Vector3.Lerp(gameCamera.transform.position, target, Time.deltaTime * 8f);
        }

        private void EnsureSprite()
        {
            if (whiteSprite != null)
            {
                return;
            }

            whiteTexture = new Texture2D(1, 1, TextureFormat.RGBA32, false)
            {
                filterMode = FilterMode.Point,
                wrapMode = TextureWrapMode.Clamp,
                name = "Generated White Pixel"
            };
            whiteTexture.SetPixel(0, 0, Color.white);
            whiteTexture.Apply();
            whiteSprite = Sprite.Create(whiteTexture, new Rect(0f, 0f, 1f, 1f), new Vector2(0.5f, 0.5f), 1f);
            whiteSprite.name = "Generated White Sprite";
        }

        private bool IsOnRoad(Vector2 point)
        {
            return point.y > 5.6f && point.y < 8f ||
                   point.y > -2.2f && point.y < 0.3f ||
                   point.y > -8.2f && point.y < -5.8f ||
                   point.x > -7.2f && point.x < -4.7f ||
                   point.x > 0.4f && point.x < 2.7f ||
                   point.x > 7.8f && point.x < 10.2f;
        }

        private static Rect Expand(Rect rect, float amount)
        {
            return new Rect(rect.xMin - amount, rect.yMin - amount, rect.width + amount * 2f, rect.height + amount * 2f);
        }

        private static Color PaletteFloor()
        {
            return new Color(0.17f, 0.16f, 0.16f);
        }

        private static Color PaletteWall()
        {
            return new Color(0.35f, 0.33f, 0.3f);
        }

        private static Color PaletteWood()
        {
            return new Color(0.32f, 0.19f, 0.1f);
        }

        private static Rect CenteredRect(float width, float height, float yPercent)
        {
            return new Rect((Screen.width - width) * 0.5f, Screen.height * yPercent, width, height);
        }

        private static void DrawFullscreen(Color color)
        {
            var previous = GUI.color;
            GUI.color = color;
            GUI.DrawTexture(new Rect(0f, 0f, Screen.width, Screen.height), Texture2D.whiteTexture);
            GUI.color = previous;
        }

        private void SetupGuiStyles()
        {
            if (titleStyle != null)
            {
                return;
            }

            titleStyle = new GUIStyle(GUI.skin.label)
            {
                alignment = TextAnchor.MiddleCenter,
                fontSize = 44,
                normal = { textColor = new Color(0.86f, 0.82f, 0.7f) }
            };
            subtitleStyle = new GUIStyle(GUI.skin.label)
            {
                alignment = TextAnchor.MiddleCenter,
                fontSize = 18,
                normal = { textColor = new Color(0.64f, 0.62f, 0.58f) }
            };
            panelStyle = new GUIStyle(GUI.skin.box)
            {
                normal =
                {
                    background = MakeGuiTexture(new Color(0.035f, 0.033f, 0.04f, 0.9f))
                }
            };
            labelStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 18,
                wordWrap = true,
                normal = { textColor = new Color(0.86f, 0.84f, 0.76f) }
            };
            buttonStyle = new GUIStyle(GUI.skin.button)
            {
                fontSize = 22,
                normal = { textColor = new Color(0.9f, 0.84f, 0.67f) },
                hover = { textColor = Color.white },
                active = { textColor = Color.white }
            };
        }

        private static Texture2D MakeGuiTexture(Color color)
        {
            var texture = new Texture2D(1, 1, TextureFormat.RGBA32, false);
            texture.SetPixel(0, 0, color);
            texture.Apply();
            return texture;
        }
    }
}

using System.IO;
using OldChurchGame;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace OldChurchGame.Editor
{
    public static class CreatePlayableScene
    {
        private const string ScenePath = "Assets/Scenes/Main.unity";

        [MenuItem("Tools/Old Church/Rebuild Playable Scene")]
        public static void Build()
        {
            Directory.CreateDirectory("Assets/Scenes");

            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            scene.name = "Main";

            var cameraObject = new GameObject("Main Camera");
            cameraObject.tag = "MainCamera";
            var camera = cameraObject.AddComponent<Camera>();
            camera.orthographic = true;
            camera.orthographicSize = 7.5f;
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.02f, 0.02f, 0.025f);
            cameraObject.transform.position = new Vector3(0f, -5.7f, -10f);

            var gameObject = new GameObject("Old Church Prototype");
            var game = gameObject.AddComponent<UnityPrototypeGame>();
            game.BuildEditorPreview();

            PlayerSettings.productName = "旧教堂";
            PlayerSettings.companyName = "Indie Prototype";

            EditorSceneManager.SaveScene(scene, ScenePath);
            AssetDatabase.Refresh();

            AssetDatabase.ImportAsset(ScenePath);
            var buildScene = new EditorBuildSettingsScene(ScenePath, true);
            var sceneGuid = AssetDatabase.AssetPathToGUID(ScenePath);
            if (!string.IsNullOrEmpty(sceneGuid))
            {
                buildScene.guid = new GUID(sceneGuid);
            }

            EditorBuildSettings.scenes = new[] { buildScene };

            AssetDatabase.SaveAssets();
            EditorSceneManager.OpenScene(ScenePath);
        }
    }
}

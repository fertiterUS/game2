using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace OldChurchGame.Editor
{
    [InitializeOnLoad]
    public static class StartupSceneOpener
    {
        private const string ScenePath = "Assets/Scenes/Main.unity";

        static StartupSceneOpener()
        {
            EditorApplication.delayCall += OpenMainSceneWhenProjectStarts;
        }

        private static void OpenMainSceneWhenProjectStarts()
        {
            var absoluteScenePath = Path.Combine(Application.dataPath, "Scenes", "Main.unity");
            if (Application.isBatchMode || EditorApplication.isPlayingOrWillChangePlaymode || !File.Exists(absoluteScenePath))
            {
                return;
            }

            var activeScene = SceneManager.GetActiveScene();
            if (activeScene.path == ScenePath)
            {
                return;
            }

            var looksLikeUnityDefaultScene = string.IsNullOrEmpty(activeScene.path) && activeScene.rootCount <= 2;
            if (looksLikeUnityDefaultScene)
            {
                EditorSceneManager.OpenScene(ScenePath);
            }
        }
    }
}

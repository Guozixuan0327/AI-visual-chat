/**
 * Request and check media permissions
 */
export async function requestMediaPermissions(
  video: boolean = true,
  audio: boolean = true
): Promise<boolean> {
  try {
    const permission = await navigator.permissions.query({
      name: 'camera' as PermissionName,
    } as PermissionDescriptor);

    if (permission.state === 'denied') {
      return false;
    }

    // Try to get the media stream to trigger permission prompt
    const constraints: MediaStreamConstraints = {};
    if (video) constraints.video = true;
    if (audio) constraints.audio = true;

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Stop all tracks immediately after getting permission
    stream.getTracks().forEach((track) => track.stop());

    return true;
  } catch (error) {
    console.error('Permission request failed:', error);
    return false;
  }
}

/**
 * Check if browser supports required media APIs
 */
export function checkBrowserSupport(): {
  camera: boolean;
  microphone: boolean;
  speechRecognition: boolean;
} {
  return {
    camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    microphone: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    speechRecognition: !!(
      window.SpeechRecognition || window.webkitSpeechRecognition
    ),
  };
}

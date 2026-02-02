<?php
// hw2/fingerprint_api.php
header('Content-Type: application/json');

// Configuration
$sessionDir = __DIR__ . '/sessions/';
if (!is_dir($sessionDir)) {
    mkdir($sessionDir, 0777, true);
}

// 1. Get Params
$action = $_GET['action'] ?? 'save';
$visitorId = $_REQUEST['visitorId'] ?? '';
$cookieName = 'fp_session_cookie';

// Validation
if (empty($visitorId)) {
    echo json_encode(['error' => 'No Fingerprint ID provided']);
    exit;
}

// File path based on Fingerprint (The "Persistent" Store)
$fpFile = $sessionDir . 'fp_' . preg_replace('/[^a-z0-9]/i', '', $visitorId) . '.txt';

// Handle POST (Saving Data)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = $_POST['data'] ?? '';
    file_put_contents($fpFile, $data);
    
    // Also set a standard session cookie to prove we have both
    setcookie($cookieName, 'active_session_' . time(), time() + 3600, "/");
    
    echo json_encode(['status' => 'saved', 'data' => $data]);
    exit;
}

// Handle GET (Loading/Restoring)
if ($action === 'load') {
    $savedData = '';
    if (file_exists($fpFile)) {
        $savedData = file_get_contents($fpFile);
    }

    // Logic: Do we have a cookie?
    $hasCookie = isset($_COOKIE[$cookieName]);
    
    $response = [
        'data' => $savedData,
        'has_cookie' => $hasCookie,
        'status' => 'normal'
    ];

    // THE MAGIC: If cookie is missing but we found data, we RESTORED it via fingerprint
    if (!$hasCookie && !empty($savedData)) {
        $response['status'] = 'restored';
        // Re-issue the cookie silently to "re-associate" them officially
        setcookie($cookieName, 'restored_session_' . time(), time() + 3600, "/");
    }

    echo json_encode($response);
    exit;
}
?>

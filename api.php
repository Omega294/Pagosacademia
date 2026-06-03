<?php
/**
 * ACADEMIA PRO - API BACKEND EN PHP
 * Diseñado para alojar el sistema en hostings gratuitos como InfinityFree.
 * 
 * Este archivo reemplaza a 'server.js' en la nube y maneja de forma automática
 * la lectura y guardado persistente de la base de datos de tu academia.
 */

// Cabeceras CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

// Manejo de petición pre-vuelo OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ==========================================
// CONFIGURACIÓN DE ALMACENAMIENTO
// ==========================================
// MODO_BD:
// - false: Guarda los datos en un archivo 'academy_data.json' en el mismo servidor (fácil, no requiere configurar nada).
// - true: Guarda los datos en una base de datos MySQL (recomendado para InfinityFree por mayor robustez y durabilidad).
define('MODO_BD', false); 

// CREDENCIALES MYSQL (Solo si MODO_BD es true)
define('DB_HOST', 'sqlXXX.infinityfree.com'); // Reemplaza con tu servidor de base de datos de InfinityFree
define('DB_USER', 'if0_xxxxxxxx');            // Reemplaza con tu usuario de InfinityFree
define('DB_PASS', 'xxxxxxxxxx');              // Reemplaza con tu contraseña de la base de datos
define('DB_NAME', 'if0_xxxxxxxx_academia');   // Reemplaza con el nombre de tu base de datos creado

$json_file = __DIR__ . '/academy_data.json';

// ==========================================
// MÉTODO GET: RETORNAR LOS DATOS DEL SISTEMA
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (MODO_BD) {
        try {
            $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
            
            // Crear tabla de persistencia si no existe
            $pdo->exec("CREATE TABLE IF NOT EXISTS config_store (
                id VARCHAR(50) PRIMARY KEY,
                val LONGTEXT NOT NULL
            )");
            
            $stmt = $pdo->prepare("SELECT val FROM config_store WHERE id = 'academy_data'");
            $stmt->execute();
            $row = $stmt->fetch();
            
            if ($row) {
                echo $row['val'];
            } else {
                echo json_encode(["empty" => true]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["empty" => true, "error" => "Error MySQL: " . $e->getMessage()]);
        }
    } else {
        // Modo archivo JSON local
        if (file_exists($json_file)) {
            $data = file_get_contents($json_file);
            if ($data === false || trim($data) === "") {
                echo json_encode(["empty" => true]);
            } else {
                echo $data;
            }
        } else {
            echo json_encode(["empty" => true]);
        }
    }
    exit();
}

// ==========================================
// MÉTODO POST: GUARDAR LOS DATOS EN EL SISTEMA
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Obtener los datos enviados
    $input = file_get_contents('php://input');
    
    // Validar que el JSON recibido sea válido
    $decoded = json_decode($input, true);
    if ($decoded === null) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "JSON inválido enviado al servidor."]);
        exit();
    }
    
    if (MODO_BD) {
        try {
            $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);
            
            // Crear tabla si no existe
            $pdo->exec("CREATE TABLE IF NOT EXISTS config_store (
                id VARCHAR(50) PRIMARY KEY,
                val LONGTEXT NOT NULL
            )");
            
            // Guardar o actualizar la fila única
            $stmt = $pdo->prepare("INSERT INTO config_store (id, val) VALUES ('academy_data', :val) 
                                   ON DUPLICATE KEY UPDATE val = :val2");
            $stmt->execute([
                ':val' => $input,
                ':val2' => $input
            ]);
            
            echo json_encode(["status" => "success"]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error al guardar en MySQL: " . $e->getMessage()]);
        }
    } else {
        // Modo archivo JSON local
        // Generar un respaldo (backup)
        if (file_exists($json_file)) {
            copy($json_file, $json_file . '.bak');
        }
        
        // Escribir el nuevo archivo
        $result = file_put_contents($json_file, json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        if ($result !== false) {
            echo json_encode(["status" => "success"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "No se pudo escribir en el archivo local del servidor. Revisa los permisos de escritura."]);
        }
    }
    exit();
}

import { WebSocketServer } from 'ws';
import fs from 'fs/promises';
import path from 'path';
import chokidar from 'chokidar';

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

console.log(`🚀 WebSocket server running on port ${PORT}`);

wss.on('connection', (ws) => {
  console.log('✅ Client connected');

  // Handle ping/pong to keep connection alive
  ws.on('ping', () => {
    ws.pong();
  });

  // Handle incoming messages
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.action) {
        case 'read':
          // Read file content
          const content = await fs.readFile(data.path, 'utf8');
          ws.send(JSON.stringify({
            action: 'read',
            path: data.path,
            content,
            success: true,
          }));
          console.log(`📖 Read file: ${data.path}`);
          break;

        case 'write':
          // Write file content
          await fs.writeFile(data.path, data.content, 'utf8');
          ws.send(JSON.stringify({
            action: 'write',
            path: data.path,
            success: true,
          }));
          console.log(`💾 Wrote file: ${data.path}`);
          break;

        case 'list':
          // Recursively list files in directory
          async function listRecursive(dirPath, basePath = dirPath) {
            const items = await fs.readdir(dirPath);
            const results = [];
            
            for (const item of items) {
              const itemPath = path.join(dirPath, item);
              const relativePath = path.relative(basePath, itemPath);
              const stat = await fs.stat(itemPath);
              
              if (stat.isDirectory()) {
                // Recursively list subdirectories (but skip node_modules and dist)
                if (!itemPath.includes('node_modules') && !itemPath.includes('dist')) {
                  const subItems = await listRecursive(itemPath, basePath);
                  results.push(...subItems);
                }
              } else {
                // Add file to results
                results.push({
                  name: item,
                  path: itemPath,
                  isDirectory: false,
                });
              }
            }
            
            return results;
          }
          
          try {
            const allFiles = await listRecursive(data.path);
            ws.send(JSON.stringify({
              action: 'list',
              path: data.path,
              files: allFiles,
              success: true,
            }));
            console.log(`📂 Listed directory (recursive): ${data.path} - ${allFiles.length} files`);
          } catch (error) {
            ws.send(JSON.stringify({
              action: 'list',
              path: data.path,
              error: error.message,
              success: false,
            }));
            console.error(`❌ Error listing directory: ${error.message}`);
          }
          break;

        case 'create':
          // Create new file (create directory if it doesn't exist)
          const dirPath = path.dirname(data.path);
          try {
            await fs.mkdir(dirPath, { recursive: true });
          } catch (error) {
            // Directory might already exist, that's fine
          }
          await fs.writeFile(data.path, data.content || '', 'utf8');
          ws.send(JSON.stringify({
            action: 'create',
            path: data.path,
            success: true,
          }));
          console.log(`✨ Created file: ${data.path}`);
          break;

        case 'delete':
          // Delete file
          await fs.unlink(data.path);
          ws.send(JSON.stringify({
            action: 'delete',
            path: data.path,
            success: true,
          }));
          console.log(`🗑️  Deleted file: ${data.path}`);
          break;
      }
    } catch (error) {
      ws.send(JSON.stringify({
        error: error.message,
        success: false,
      }));
      console.error(`❌ Error: ${error.message}`);
    }
  });

  // Watch for file changes and notify client
  const watcher = chokidar.watch(['src/**/*', 'public/**/*'], {
    ignored: /(node_modules|dist)/,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
  });

  watcher.on('change', (filePath) => {
    // Only notify about changes, don't auto-reload
    // The IDE will handle saves through the WebSocket write command
    console.log(`🔄 File changed externally: ${filePath}`);
  });

  ws.on('close', () => {
    watcher.close();
    console.log('❌ Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Handle server errors
wss.on('error', (error) => {
  console.error('WebSocket Server error:', error);
});

console.log('Ready for connections!');

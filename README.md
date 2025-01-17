### LLM Extension for Ollama and Vscode. Supports OPENAPI and Local Models. 

To run:  npm install. Type npm run compile. Then click on extension.ts and press f5.

To package and add to your vscode extension library:  
`npm install -g @vscode/vsce

```
$ cd myExtension
$ vsce package
# myExtension.vsix generated
$ vsce publish
# <publisher id>.myExtension published to VS Code Marketplace
```

You can goto extensions and install via vsix extensions. 
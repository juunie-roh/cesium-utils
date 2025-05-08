---
"@juun-roh/cesium-utils": patch
---

Update Test Environments

test: Update test environment

* Change test environment as "jsdom" from "node".  
Add jsdom package.  
Specify environment as jsdom in vite configuration.  

* Create mock for cesium elements.  
Exclude `__mocks__` directory from test coverage.  
Create mock cesium.  

* Conduct a new test case for `cloneViewer`.  

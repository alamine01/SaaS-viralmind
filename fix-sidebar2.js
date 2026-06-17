
const fs = require("fs");
let code = fs.readFileSync("components/dashboard/Sidebar.tsx", "utf8");

code = code.replace(/className=\{w-5 h-5 transition-transform duration-200 \$\{sidebarExpanded \? "rotate-180" : ""\}\}/g, "className={`w-5 h-5 transition-transform duration-200 ${sidebarExpanded ? \"rotate-180\" : \"\"}`}");

code = code.replace(/className=\{hidden text-center w-6 \$\{\!sidebarExpanded \? "lg:block" : "lg:hidden"\}\}/g, "className={`hidden text-center w-6 ${!sidebarExpanded ? \"lg:block\" : \"lg:hidden\"}`}");

code = code.replace(/className=\{lg:block \$\{\!sidebarExpanded && "lg:hidden"\}\}/g, "className={`lg:block ${!sidebarExpanded ? \"lg:hidden\" : \"\"}`}");

code = code.replace(/className=\{\t?ext-sm font-medium ml-4 transition-opacity duration-200 \$\{\!sidebarExpanded \? "lg:opacity-0 lg:hidden" : "lg:opacity-100 lg:block"\}\}/g, "className={`text-sm font-medium ml-4 transition-opacity duration-200 ${!sidebarExpanded ? \"lg:opacity-0 lg:hidden\" : \"lg:opacity-100 lg:block\"}`}");

code = code.replace(/className=\{\t?ext-sm font-medium transition-opacity duration-200 \$\{\!sidebarExpanded \? "lg:opacity-0 lg:hidden" : "lg:opacity-100 lg:block"\}\}/g, "className={`text-sm font-medium transition-opacity duration-200 ${!sidebarExpanded ? \"lg:opacity-0 lg:hidden\" : \"lg:opacity-100 lg:block\"}`}");

code = code.replace(/className=\{\x0Clex justify-between items-center pr-4 \$\{\!sidebarExpanded \? "lg:hidden" : "lg:flex"\}\}/g, "className={`flex justify-between items-center pr-4 ${!sidebarExpanded ? \"lg:hidden\" : \"lg:flex\"}`}");

code = code.replace(/className=\{mt-auto pt-6 duration-200 hidden \$\{sidebarExpanded \? "lg:block" : "lg:hidden"\}\}/g, "className={`mt-auto pt-6 duration-200 hidden ${sidebarExpanded ? \"lg:block\" : \"lg:hidden\"}`}");

fs.writeFileSync("components/dashboard/Sidebar.tsx", code);


const fs = require('fs');
let code = fs.readFileSync('components/dashboard/Sidebar.tsx', 'utf8');

// 1. Sidebar Container Width
code = code.replace(/w-64 lg:w-64 shrink-0/g, 'w-64 \$\{sidebarExpanded ? "lg:w-64" : "lg:w-20"\} shrink-0');

// 2. Desktop Toggle Button
code = code.replace(
  /<div className="flex justify-between mb-10 pr-3 sm:px-2">/,
  '<div className="flex justify-between items-center mb-10 pr-3 sm:px-2">'
);
code = code.replace(
  /<\/Link>\s*<\/div>/,
  '</Link>\n          <button className="hidden lg:block text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" onClick={() => setSidebarExpanded(!sidebarExpanded)}>\n            <svg className={w-5 h-5 transition-transform duration-200 \$\{sidebarExpanded ? "rotate-180" : ""\}} fill="none" stroke="currentColor" viewBox="0 0 24 24">\n              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />\n            </svg>\n          </button>\n        </div>'
);

// 3. Link text spans (there are 10 of these)
code = code.replace(
  /<span className="text-sm font-medium ml-4  duration-200">/g,
  '<span className={	ext-sm font-medium ml-4 transition-opacity duration-200 \$\{!sidebarExpanded ? "lg:opacity-0 lg:hidden" : "lg:opacity-100 lg:block"\}}>'
);

// 4. Admin text spans (there are 3 of these)
code = code.replace(
  /<span className="text-sm font-medium  duration-200">/g,
  '<span className={	ext-sm font-medium transition-opacity duration-200 \$\{!sidebarExpanded ? "lg:opacity-0 lg:hidden" : "lg:opacity-100 lg:block"\}}>'
);

// 5. Menu label
code = code.replace(
  /<span className="lg:block">\s*Menu\s*<\/span>/,
  '<span className={lg:block \$\{!sidebarExpanded && "lg:hidden"\}}>\n                Menu\n              </span>'
);

// 6. Workspaces section header
code = code.replace(
  /<span className="lg:block flex justify-between items-center pr-4">/g,
  '<span className={lex justify-between items-center pr-4 \$\{!sidebarExpanded ? "lg:hidden" : "lg:flex"\}}>'
);

// 7. Workspaces section items
code = code.replace(
  /<span className=\{	ext-sm font-medium ml-3  duration-200 \$\{isActive \? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'\}\}>/g,
  '<span className={	ext-sm font-medium ml-3 transition-opacity duration-200 \$\{!sidebarExpanded ? "lg:opacity-0 lg:hidden" : "lg:opacity-100 lg:block"\} \$\{isActive ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"\}}>'
);

// 8. Quotas section container
code = code.replace(
  /<div className="mt-auto pt-6 duration-200 hidden lg:block">/,
  '<div className={mt-auto pt-6 duration-200 hidden \$\{sidebarExpanded ? "lg:block" : "lg:hidden"\}}>'
);

// 9. Fix Three dots for Menu & Workspaces headers
code = code.replace(
  /<span className="hidden text-center w-6" aria-hidden="true">/g,
  '<span className={hidden text-center w-6 \$\{!sidebarExpanded ? "lg:block" : "lg:hidden"\}} aria-hidden="true">'
);

fs.writeFileSync('components/dashboard/Sidebar.tsx', code);

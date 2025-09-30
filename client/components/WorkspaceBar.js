/**
 * Discord-style workspace bar component
 * Vertical bar on the far left showing workspace icons
 */

export default function WorkspaceBar({
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  onJoinWorkspace
}) {
  
  // Generate workspace avatar (first letter of name)
  const getWorkspaceAvatar = (workspace) => {
    return workspace.name.charAt(0).toUpperCase();
  };

  return (
    <div className="w-16 bg-gray-900 flex flex-col items-center py-3 space-y-2 h-screen">
      {/* Current Workspaces */}
      {workspaces.map(workspace => (
        <button
          key={workspace.id}
          onClick={() => {
            console.log('Workspace clicked:', workspace.id, workspace.name);
            console.log('Current workspace:', currentWorkspace?.id, currentWorkspace?.name);
            onSelectWorkspace(workspace.id);
          }}
          className={`group relative w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all duration-200 ${
            currentWorkspace?.id === workspace.id
              ? 'bg-primary-600 rounded-2xl'
              : 'bg-gray-700 hover:bg-primary-500 hover:rounded-2xl'
          }`}
          title={workspace.name}
        >
          {getWorkspaceAvatar(workspace)}
          
          {/* Active indicator */}
          {currentWorkspace?.id === workspace.id && (
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full -ml-2"></div>
          )}
          
          {/* Hover tooltip */}
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-black text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {workspace.name}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-black rotate-45"></div>
          </div>
        </button>
      ))}
      
      {/* Separator */}
      {workspaces.length > 0 && (
        <div className="w-8 h-px bg-gray-600 my-2"></div>
      )}
      
      {/* Add Workspace Button */}
      <button
        onClick={onCreateWorkspace}
        className="group relative w-12 h-12 rounded-full bg-gray-700 hover:bg-green-600 hover:rounded-2xl flex items-center justify-center text-green-400 hover:text-white text-2xl font-bold transition-all duration-200"
        title="Create Workspace"
      >
        +
        
        {/* Hover tooltip */}
        <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-black text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          Create Workspace
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-black rotate-45"></div>
        </div>
      </button>
      
      {/* Join Workspace Button */}
      <button
        onClick={onJoinWorkspace}
        className="group relative w-12 h-12 rounded-full bg-gray-700 hover:bg-blue-600 hover:rounded-2xl flex items-center justify-center text-blue-400 hover:text-white text-lg transition-all duration-200"
        title="Join Workspace"
      >
        🔗
        
        {/* Hover tooltip */}
        <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-black text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          Join Workspace
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-black rotate-45"></div>
        </div>
      </button>
      
      {/* Bottom spacer */}
      <div className="flex-1"></div>
    </div>
  );
}

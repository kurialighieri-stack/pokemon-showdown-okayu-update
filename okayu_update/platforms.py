"""Small OS boundary; no shell commands or profile data in process inspection."""
from contextlib import contextmanager
import os
from pathlib import Path

WINDOWS = os.name == 'nt'

def long_path(path):
    path=Path(path).expanduser().resolve()
    if WINDOWS and not str(path).startswith('\\\\?\\'):
        value=str(path)
        return Path('\\\\?\\UNC\\'+value[2:] if value.startswith('\\\\') else '\\\\?\\'+value)
    return path

def native_path(path):
    value=str(path)
    if value.startswith('\\\\?\\UNC\\'):return '\\\\'+value[8:]
    return value[4:] if value.startswith('\\\\?\\') else value

@contextmanager
def build_directory(path):
    """pnpm uses chdir(), which still needs a short path on Windows."""
    path=long_path(path);path.mkdir(parents=True,exist_ok=True)
    if not WINDOWS:
        yield path;return
    import subprocess
    for letter in 'ZYXWVUTSRQP':
        drive=letter+':'
        if Path(drive+'/').exists():continue
        result=subprocess.run(['subst.exe',drive,native_path(path)],capture_output=True,creationflags=subprocess.CREATE_NO_WINDOW)
        if result.returncode:continue
        try:yield Path(drive+'/')
        finally:subprocess.run(['subst.exe',drive,'/D'],capture_output=True,creationflags=subprocess.CREATE_NO_WINDOW,check=True)
        return
    raise OSError('No hay una letra de unidad libre para compilar Calcdex en una ruta corta.')

def data_directory():
    base = Path(os.environ.get('LOCALAPPDATA', Path.home()/'AppData/Local')) if WINDOWS else Path(os.environ.get('XDG_DATA_HOME', Path.home()/'.local/share'))
    return Path(os.environ.get('OKAYU_UPDATE_DATA', base/'pokemon-showdown-okayu-update')).expanduser().resolve()

@contextmanager
def file_lock(path):
    with Path(path).open('a+b') as handle:
        if WINDOWS:
            import msvcrt
            if handle.seek(0, 2) == 0:
                handle.write(b'\0'); handle.flush()
            handle.seek(0)
            try: msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
            except OSError as error: raise BlockingIOError('Operation already locked') from error
            try: yield
            finally:
                handle.seek(0); msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
        else:
            import fcntl
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
            try: yield
            finally: fcntl.flock(handle, fcntl.LOCK_UN)

def windows_processes():
    """Yield executable paths, refusing inaccessible Showdown processes."""
    import ctypes
    from ctypes import wintypes as w
    class Entry(ctypes.Structure):
        _fields_ = [('size',w.DWORD),('usage',w.DWORD),('pid',w.DWORD),('heap',ctypes.c_size_t),('module',w.DWORD),('threads',w.DWORD),('parent',w.DWORD),('priority',w.LONG),('flags',w.DWORD),('exe',w.WCHAR*260)]
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    kernel.CreateToolhelp32Snapshot.argtypes = [w.DWORD,w.DWORD]; kernel.CreateToolhelp32Snapshot.restype = w.HANDLE
    kernel.Process32FirstW.argtypes = [w.HANDLE,ctypes.POINTER(Entry)]; kernel.Process32FirstW.restype = w.BOOL
    kernel.Process32NextW.argtypes = [w.HANDLE,ctypes.POINTER(Entry)]; kernel.Process32NextW.restype = w.BOOL
    kernel.OpenProcess.argtypes = [w.DWORD,w.BOOL,w.DWORD]; kernel.OpenProcess.restype = w.HANDLE
    kernel.QueryFullProcessImageNameW.argtypes = [w.HANDLE,w.DWORD,w.LPWSTR,ctypes.POINTER(w.DWORD)]; kernel.QueryFullProcessImageNameW.restype = w.BOOL
    kernel.GetExitCodeProcess.argtypes = [w.HANDLE,ctypes.POINTER(w.DWORD)]; kernel.GetExitCodeProcess.restype = w.BOOL
    kernel.CloseHandle.argtypes = [w.HANDLE]; kernel.CloseHandle.restype = w.BOOL
    snapshot = kernel.CreateToolhelp32Snapshot(2,0)
    if snapshot == ctypes.c_void_p(-1).value: raise ctypes.WinError(ctypes.get_last_error())
    try:
        entry = Entry(); entry.size = ctypes.sizeof(entry)
        valid = kernel.Process32FirstW(snapshot,ctypes.byref(entry))
        while valid:
            if entry.pid != os.getpid():
                handle = kernel.OpenProcess(0x1000,False,entry.pid)
                try:
                    buffer = ctypes.create_unicode_buffer(32768); size = w.DWORD(len(buffer))
                    if handle and kernel.QueryFullProcessImageNameW(handle,0,buffer,ctypes.byref(size)):
                        yield Path(buffer.value).resolve()
                    elif 'showdown' in entry.exe.lower() and ctypes.get_last_error() not in (87,1168):
                        code=w.DWORD()
                        exited=handle and kernel.GetExitCodeProcess(handle,ctypes.byref(code)) and code.value!=259
                        if not exited:raise OSError('Cierra Showdown Pro: no se pudo comprobar su proceso. Ejecuta el gestor con el mismo usuario y permisos.')
                finally:
                    if handle: kernel.CloseHandle(handle)
            valid = kernel.Process32NextW(snapshot,ctypes.byref(entry))
    finally: kernel.CloseHandle(snapshot)

def launcher(install):
    install = Path(install)
    if not WINDOWS: return install/'AppRun'
    for name in ('Pokemon Showdown Pro.exe','PokemonShowdownPro.exe','pokemon-showdown-pro.exe'):
        if (install/name).is_file(): return install/name
    raise OSError('No se encontró el ejecutable de Pokémon Showdown Pro.')

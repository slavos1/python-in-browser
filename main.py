from pyodide.http import pyfetch

async def greet(data):
    try:
        # is of class pyodide.ffi.JsProxy
        data = data.to_py()
    except:
        pass
    title = f'Hello from {__file__}, you said {data!r}'
    print(title)
    response = await pyfetch('https://jsonplaceholder.typicode.com/todos/1')
    print("Status:", response.status)
    print("dir:", dir(response))
    print("Content-type:", response.headers['content-type'])
    data = await response.json()
    print("Body:", data)

    return {'title':title, 'data':data, 'headers':response.headers}
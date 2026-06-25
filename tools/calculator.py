def calculator_tool(task):
    try:
        expression = task.lower().replace("calculate", "")
        result = eval(expression)
        return f"Calculation result: {result}"
    except:
        return "Could not calculate expression"
from ..models.state_models import SupervisorState
from ..agents.base import build_agent_state
# from ..tools.tool_wrappers import invoke_agent
from ..mcp.clients import init_clients

from langgraph.prebuilt import create_react_agent
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

import json
import os
from langchain.chat_models import init_chat_model

llm=init_chat_model("openai:gpt-4o-mini")

# Load available indicators from JSON
def load_available_indicators():
    """Load list of available indicators from indicators_full.json"""
    try:
        json_path = os.path.join(os.path.dirname(__file__), "..", "mcp", "servers", "indicators_full.json")
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return sorted(list(data.keys()))
    except Exception as e:
        print(f"Warning: Could not load indicators: {e}")
        return []

AVAILABLE_INDICATORS = load_available_indicators()

async def financial_agent_node(state: SupervisorState) -> SupervisorState:
    """Run the financial agent with the current task and update state."""

    # Format available indicators for display
    indicators_list = ", ".join(AVAILABLE_INDICATORS[:30])  # Show first 30 for brevity
    indicators_note = f"Plus {len(AVAILABLE_INDICATORS) - 30} more..." if len(AVAILABLE_INDICATORS) > 30 else ""

    sysprompt_fin_agent = f"""
You are an advanced cryptocurrency and financial analysis AI assistant equipped with specialized tools
to access and analyze financial data. Your primary function is to help users with
crypto market analysis and trading research.

AVAILABLE TOOLS (CHOOSE WISELY - MAX 1-2 TOOLS):
================================================================
1. get_indicator(endpoint, symbol, interval, results)
   - Technical indicator analysis tool
   - Available indicators ({len(AVAILABLE_INDICATORS)} total):
     {indicators_list}
     {indicators_note}
   - Returns: Indicator values, meaning, inference, and interpretation for past X candles
   - When to use: For specific technical analysis patterns, momentum, trend confirmation

CRITICAL RULES - API RATE LIMITING:
================================================================
⚠️ MAXIMUM 1-2 TOOLS PER RESPONSE - CHOOSE WISELY!
⚠️ DO NOT make redundant calls if context already has the data
⚠️ API has strict rate limiting - each call costs credits
⚠️ Analyze context first, then select ONLY the most relevant tools
⚠️ Prioritize tools that give maximum insight with minimum calls

DECISION PROCESS:
1. Read the user query carefully
2. Check if answer already exists in context
3. Identify what data you MUST retrieve (max 2-3 tools)
4. Call only those tools - no more
5. Synthesize results into clear analysis

Context so far: {str(state.context)}

GUIDELINES:
- Before deciding on tools, thoroughly analyze existing context
- Avoid redundant calls - check if similar analysis was done recently
- Your goal is accurate crypto market analysis while respecting API limits
- Include specific data points: prices, volumes, percentages, patterns
- Flag high volatility or unusual market activity
- If you can answer from context, do NOT call tools

RESPONSE FORMAT:
- Lead with the most relevant finding
- Include specific numerical data
- Explain what it means for trading
- Mention any risks or considerations
"""
    tools = await init_clients()
    finance_tools=  tools["financial_tools"]
    finance_agent = create_react_agent(
        llm.bind_tools(finance_tools ,parallel_tool_calls=False),
        tools=finance_tools,
        prompt=sysprompt_fin_agent,
        name="finance_agent",
    )
    if not state.current_task:
        return state  # no task assigned, nothing to do

    # Run the financial agent on the supervisor's current task
    # Ensure your agent is the ReAct agent you created earlier
    input = {"messages": [{"role": "user", "content": state.current_task}]}
    print("this is context ",state.context)
    result = await finance_agent.ainvoke(input=input)
    
    # Convert the messages from the agent into AgentState
    agent_state = build_agent_state(result["messages"], agent_name="finance_agent")

    # Include agent name
    # agent_state.agent_name = "FinanceAgent"

    # Add agent state to SupervisorState (flat array in sequential order)
    state.agent_states.append(agent_state)

    # Update context for downstream use
    agent_count = sum(1 for s in state.agent_states if s.agent_name == "finance_agent")
    state.context[f"finance_agent_step{agent_count}"] = agent_state.agent_output

    # Clear current_task (supervisor will decide next)
    state.current_task = None

    return state


# state = SupervisorState(user_query="check is BTC-USD is bullish or berrish and find its support and ressistance")
# state.current_task = "check is BTC-USD is bullish or berrish and find its support and ressistance"

# # Run financial agent node
# updated_state = financial_agent_node(state)

# # Show result
# print(updated_state.dump_json(indent=2))
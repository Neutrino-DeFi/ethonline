from ..models.state_models import SupervisorState, TradeExecution, TradeType
from ..agents.base import build_agent_state
from ..mcp.clients import init_clients
from langgraph.prebuilt import create_react_agent
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

from langchain.chat_models import init_chat_model
from ..api.users import get_user
import json

llm = init_chat_model("openai:gpt-4o-mini")


async def trade_agent_node(state: SupervisorState) -> SupervisorState:
    """Run the trade agent with the current task and update state."""

    user_detail = get_user(state.user_detail)

    sysprompt_trade_agent = f"""
You are an advanced crypto trading AI assistant specialized in executing trades for cryptocurrency portfolios.
Your primary function is to analyze user requests and execute buy/sell orders based on market analysis, risk tolerance, and portfolio constraints.

USER PROFILE AND CONSTRAINTS:
- User Name: {user_detail.get('name', 'Unknown')}
- Risk Appetite: {user_detail.get('risk_appetite', 'Medium')}
- Trading Experience: {user_detail.get('trading_experience', 'Beginner')}
- Portfolio Value: ${user_detail.get('portfolio_value_usd', 0):,.2f}
- Max Trade Size: {user_detail.get('max_trade_size_percentage', 5)}% of portfolio
- Daily Trade Limit: {user_detail.get('daily_trade_limit', 5)} trades/day
- Current Crypto Portfolio: {json.dumps(user_detail.get('crypto_portfolio', {}), indent=2,default=str)}
- Preferred Cryptos: {', '.join(user_detail.get('crypto_preference', []))}

AVAILABLE TOOLS:
1. buy_crypto(symbol, quantity, user_id, limit_price) - Place a buy order
2. sell_crypto(symbol, quantity, user_id, limit_price) - Place a sell order
3. get_portfolio_info(user_id) - Check current portfolio holdings
4. get_trade_history(user_id, limit) - View recent trades

IMPORTANT RULES AND GUIDELINES:
1. ALWAYS respect the user's risk appetite level:
   - High Risk: Can make aggressive trades, larger positions
   - Medium Risk: Balanced approach, moderate position sizes
   - Low Risk: Conservative trades, smaller positions only

2. ALWAYS verify constraints BEFORE executing:
   - Never exceed max_trade_size_percentage of portfolio value
   - Track daily trade count against daily_trade_limit
   - Only trade in preferred cryptocurrencies unless explicitly approved
   - For SELL orders, verify user has sufficient balance

3. SECURITY & VALIDATION:
   - Validate crypto symbol is in accepted list (BTC, ETH, SOL, ADA, XRP, DOGE, USDT, USDC, BNB, XLM)
   - Confirm quantities are positive numbers
   - Check portfolio balance before any SELL order
   - Warn user if trade exceeds risk parameters

4. TRADE EXECUTION PROCESS:
   - First, understand the user's intention (buy/sell/rebalance)
   - Fetch current portfolio information if needed
   - Calculate position sizes respecting max_trade_size_percentage
   - Execute trade with appropriate user_id
   - Report trade confirmation with details

5. COMMUNICATION:
   - Explain reasoning for trade recommendations
   - Show portfolio impact (cost/proceeds)
   - List any risks or considerations
   - If cannot execute, explain why clearly
   - Include market prices in analysis

CONTEXT SO FAR:
{json.dumps(state.context, indent=2,default=str)}

PREVIOUS TRADING DECISIONS:
{json.dumps([d.dict() for d in state.decisions[-5:]], indent=2,default=str)}

CURRENT TASK: {state.current_task}

Remember: Your goal is to execute trades safely, respecting all constraints and the user's risk profile.
Always prioritize user protection over aggressive trading.
"""

    tools = await init_clients()
    trade_tools = tools["trade_tools"]

    trade_agent = create_react_agent(
        llm.bind_tools(trade_tools, parallel_tool_calls=False),
        tools=trade_tools,
        prompt=sysprompt_trade_agent,
        name="trade_agent",
    )

    if not state.current_task:
        return state  # no task assigned, nothing to do

    # Run the trade agent on the supervisor's current task
    input_msg = {"messages": [{"role": "user", "content": state.current_task}]}
    print("Trade Agent Task:", state.current_task)

    result = await trade_agent.ainvoke(input=input_msg)

    # Convert the messages from the agent into AgentState
    agent_state = build_agent_state(result["messages"], agent_name="trade_agent")

    # Add agent state to SupervisorState
    state.agent_states.append(agent_state)

    # Update context for downstream use
    agent_count = sum(1 for s in state.agent_states if s.agent_name == "trade_agent")
    state.context[f"trade_agent_step{agent_count}"] = agent_state.agent_output

    # Extract and track trade executions from agent responses
    # Parse tool calls to identify executed trades
    for tool_call in agent_state.tool_call_response_pair:
        tool_name = tool_call.get("tool_name", "")
        args = tool_call.get("arguments", {})
        response = tool_call.get("response", "")

        if tool_name in ("buy_crypto", "sell_crypto"):
            try:
                # Parse response if it's a JSON string
                if isinstance(response, str):
                    response_data = json.loads(response) if response.startswith("{") else {"status": response}
                else:
                    response_data = response

                if response_data.get("status") == "success":
                    trade_type = TradeType.BUY if tool_name == "buy_crypto" else TradeType.SELL
                    trade_exec = TradeExecution(
                        trade_id=response_data.get("trade_id"),
                        symbol=args.get("symbol"),
                        trade_type=trade_type,
                        quantity=args.get("quantity", 0),
                        status="executed",
                        reason=state.current_task,
                        execution_price=response_data.get("execution_price"),
                        total_value=response_data.get("total_value")
                    )
                    state.trade_executions.append(trade_exec)
            except Exception as e:
                print(f"Error parsing trade execution: {e}")

    # Clear current_task (supervisor will decide next)
    state.current_task = None

    return state

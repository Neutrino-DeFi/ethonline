import json
from ..models.state_models import SupervisorState
from ..models.state_models import *
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())
from langchain.chat_models import init_chat_model
llm=init_chat_model("openai:gpt-4o")
from ..api.users import get_user

def supervisor_node(state: SupervisorState) -> SupervisorState:
    """Supervisor decides the next agent + task based on state so far."""

    step = len(state.decisions) + 1

    system_prompt = f"""
You are the Supervisor AI, orchestrating agents for autonomous crypto trading and investment research.
Consider this user detail for every query strictly:
Here is the user or client detail: {str(get_user(state.user_detail))}

Rules:
- Never call multiple agents in parallel.
- Always analyze context first thoroughly.
- Your role is routing queries to specialized agents and synthesizing results.
- Break down the user query into minimal, clear sub-queries for other agents.
- Forward only the relevant rewritten sub-query, never the full original query.

Previous conversation context - User requests: {state.request_summary}
Previous conversation context - Responses: {state.response_summary}

Agent Selection Guide:
1. **crypto_price_agent**: Handles crypto financial data (prices, market data, technical analysis, historical data).
2. **websearch_agent**: Handles general internet knowledge or real-time events not covered by crypto data tools.
3. **news_sentiment_agent**: Analyzes market news and returns sentiment analysis relevant to crypto.
4. **trade_agent**: Executes BUY/SELL orders for cryptocurrencies. Use when:
   - User requests to buy/sell specific cryptos
   - User wants to rebalance portfolio
   - User wants to execute a specific trade strategy
   - Always include user_id and ensure it matches user constraints

Guidelines:
- Be decisive: choose only one agent per step.
- Ensure the agent receives the exact, minimal input needed.
- After all agents respond, integrate the results into a clear, final user-facing message.
- Avoid merely relaying an agent's output; synthesize and summarize.
- Before making decision, go through context thoroughly.
- Analyze context and past decisions to avoid redundant calls.
- For TRADE requests: validate user risk appetite, portfolio constraints, and preferred cryptocurrencies.

User query: {state.user_query}
Context so far: {state.context}
Trade executions so far: {[t.model_dump() for t in state.trade_executions]}

Decision Task:
0. If previous conversation has sufficient context, answer directly without calling an agent.
1. Decide if an agent is required to answer the query. If yes, select the next agent (choose from: 'crypto_price_agent', 'websearch_agent', 'news_sentiment_agent', 'trade_agent', or FINISH).
2. Specify the exact task they should perform.
3. Provide reasoning for your choice.

Respond strictly in JSON with keys: selected_agent, task, reasoning.
"""


    response = llm.invoke(system_prompt)

    # --- normalize response to string ---
    if hasattr(response, "content"):
        raw_text = response.content
    elif isinstance(response, str):
        raw_text = response
    else:
        raw_text = str(response)

    # --- try parse as JSON ---
    import json
    try:
        parsed = json.loads(raw_text)
    except Exception:
        # fallback: strip to nearest JSON object
        json_str = raw_text[raw_text.find("{"): raw_text.rfind("}") + 1]
        parsed = json.loads(json_str)

    selected_agent = parsed.get("selected_agent")
    task = parsed.get("task")
    reasoning = parsed.get("reasoning")

    # Ensure task is a string, not a dict or other type
    if isinstance(task, dict):
        task = json.dumps(task,default=str)
    elif task is None:
        task = ""
    else:
        task = str(task)

    print(system_prompt)
    # handle FINISH
    if selected_agent == "FINISH":
        # Generate comprehensive final response based on all collected context
        final_response_prompt = f"""
Be precise and to the point .Convey all message and action in less words so that user can understand easily. You have agents who worked to fulfill your guidance.

User's original query: {state.user_query}

All collected information from agents:
{json.dumps(state.context, indent=2,default=str)}

Agent execution history:
{chr(10).join([f"Step {d.step}: {d.selected_agent} - {d.task}" for d in state.decisions])}

Agent outputs:
{chr(10).join([f"{s.agent_name}: {s.agent_output}" for s in state.agent_states])}

Trade Executions Completed:
{json.dumps([t.dict() for t in state.trade_executions], indent=2,default=str)}

Previous conversation context:
Request summary: {state.request_summary}
Response summary: {state.response_summary}

Task: Synthesize all the above information into a clear, comprehensive, and well-structured response that directly answers the user's query.

Guidelines:
- Provide specific data points (crypto prices, quantities, percentages, sentiment scores, portfolio impact, etc.)
- Structure the response logically with proper formatting
- Be concise but complete
- If multiple items were requested, address each one
- Include relevant context and insights
- If trades were executed, confirm them clearly with details
- Do not mention agent names or internal processes
- Present the information as if you gathered it yourself
- Include risk warnings where appropriate

Provide your final response as plain text (not JSON).
"""

        final_response = llm.invoke(final_response_prompt)

        # Extract content from response
        if hasattr(final_response, "content"):
            state.final_output = final_response.content
        elif isinstance(final_response, str):
            state.final_output = final_response
        else:
            state.final_output = str(final_response)

        state.current_task = None
        return state

    # record decision
    decision = SupervisorDecision(
        step=step,
        selected_agent=selected_agent,
        reasoning=reasoning,
        task=task
    )
    state.decisions.append(decision)
    state.current_task = task

    return state


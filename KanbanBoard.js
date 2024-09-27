import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const KanbanBoard = () => {
  const [tickets, setTickets] = useState([]);
  const [grouping, setGrouping] = useState(localStorage.getItem('grouping') || 'status');
  const [sorting, setSorting] = useState(localStorage.getItem('sorting') || 'priority');

  useEffect(() => {
    axios.get('https://api.quicksell.co/v1/internal/frontend-assignment')
      .then(response => setTickets(response.data))
      .catch(error => console.error('Error fetching tickets:', error));
  }, []);

  useEffect(() => {
    localStorage.setItem('grouping', grouping);
    localStorage.setItem('sorting', sorting);
  }, [grouping, sorting]);

  const sortTickets = (a, b) => {
    if (sorting === 'priority') {
      return b.priority - a.priority;
    } else if (sorting === 'title') {
      return a.title.localeCompare(b.title);
    }
  };

  const groupTickets = () => {
    if (grouping === 'status') {
      return groupByStatus();
    } else if (grouping === 'user') {
      return groupByUser();
    } else if (grouping === 'priority') {
      return groupByPriority();
    }
  };

  const groupByStatus = () => {
    return tickets.reduce((groups, ticket) => {
      const status = ticket.status || 'No Status';
      if (!groups[status]) groups[status] = [];
      groups[status].push(ticket);
      return groups;
    }, {});
  };

  const groupByUser = () => {
    return tickets.reduce((groups, ticket) => {
      const user = ticket.user?.name || 'Unassigned';
      if (!groups[user]) groups[user] = [];
      groups[user].push(ticket);
      return groups;
    }, {});
  };

  const groupByPriority = () => {
    return tickets.reduce((groups, ticket) => {
      const priority = ticket.priority;
      if (!groups[priority]) groups[priority] = [];
      groups[priority].push(ticket);
      return groups;
    }, {});
  };

  // Function to handle drag end
  const onDragEnd = (result) => {
    if (!result.destination) return; // If dropped outside, do nothing

    const { source, destination } = result;

    // If dragging inside the same column
    if (source.droppableId === destination.droppableId) {
      const newTicketOrder = Array.from(groupTickets()[source.droppableId]);
      const [movedTicket] = newTicketOrder.splice(source.index, 1);
      newTicketOrder.splice(destination.index, 0, movedTicket);

      const newGroups = { ...groupTickets(), [source.droppableId]: newTicketOrder };
      setTickets(Object.values(newGroups).flat()); // Update the tickets array after reordering
    }
  };

  return (
    <div>
      <h1>Kanban Board</h1>
      <div className="controls">
        <label>Group by: </label>
        <select value={grouping} onChange={(e) => setGrouping(e.target.value)}>
          <option value="status">Status</option>
          <option value="user">User</option>
          <option value="priority">Priority</option>
        </select>

        <label>Sort by: </label>
        <select value={sorting} onChange={(e) => setSorting(e.target.value)}>
          <option value="priority">Priority</option>
          <option value="title">Title</option>
        </select>
      </div>

      {/* DragDropContext wraps the entire board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {Object.entries(groupTickets()).map(([group, tickets]) => (
            <Droppable key={group} droppableId={group}>
              {(provided) => (
                <div
                  className="kanban-column"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  <h2>{group}</h2>
                  {tickets.sort(sortTickets).map((ticket, index) => (
                    <Draggable key={ticket.id} draggableId={ticket.id.toString()} index={index}>
                      {(provided) => (
                        <div
                          className="ticket-card"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <h3>{ticket.title}</h3>
                          <p>{ticket.description}</p>
                          <span className={`priority-${ticket.priority}`}>
                            {ticket.priority === 4 ? 'Urgent' :
                              ticket.priority === 3 ? 'High' :
                                ticket.priority === 2 ? 'Medium' :
                                  ticket.priority === 1 ? 'Low' : 'No priority'}
                          </span>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <style jsx>{`
        .controls {
          margin-bottom: 20px;
        }
        .controls select {
          margin-left: 10px;
          padding: 5px;
        }

        .kanban-board {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .kanban-column {
          background-color: #f4f4f4;
          padding: 20px;
          width: 300px;
          min-height: 400px;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
        }

        .kanban-column h2 {
          text-align: center;
          margin-bottom: 20px;
        }

        .ticket-card {
          background-color: #fff;
          padding: 15px;
          margin-bottom: 10px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .ticket-card h3 {
          margin: 0 0 10px 0;
        }

        .ticket-card p {
          margin: 0 0 10px 0;
        }

        .priority-4 {
          color: red;
        }
        .priority-3 {
          color: orange;
        }
        .priority-2 {
          color: yellow;
        }
        .priority-1 {
          color: green;
        }
        .priority-0 {
          color: gray;
        }
      `}</style>
    </div>
  );
};

export default KanbanBoard;

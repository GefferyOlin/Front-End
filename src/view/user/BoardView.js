import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getToken,
  getUser,
  setToken,
  setUser
} from '../../features/user/userSlice';

import { getBoardTickets } from '../../service/ManagerService';
import { warning } from '../helper/snack';
import { Button, Form } from 'react-bootstrap';

export function BoardView() {

  let { building_id, board_token } = useParams();
  console.log(building_id, board_token);

  const dispatch = useDispatch();
  const user = useSelector(getUser);
  const navigate = useNavigate();

  const [binfo, setBinfo] = useState({
    building: {},
    tickets: [],
    internal_notes: []
  });

  const [sortStatusDir, setSortStatusDir] = useState('asc');
  const [detailIdx, setDetailIdx] = useState(null);

  const onSortStatus = () => {
    if (sortStatusDir == 'asc')
      setSortStatusDir('desc');
    else
      setSortStatusDir('asc');
  }

  const showDetail = (index) => {
    console.log(index)
    setDetailIdx(index);
  }

  useEffect(() => {
    getBoardTickets(board_token, building_id, sortStatusDir).then((response) => {
      // TODO: set data to binfo
      console.log(response);
      const { type, building, tickets, internal_notes } = response.data;
      setBinfo({
        building: building,
        tickets: tickets,
        internal_notes: internal_notes
      });
    }).catch((error) => {
      if (error.response.status == 401) {
        navigate("/board/login");
      } else {
        warning("There was an unexpected error.");
      }
    });
  }, [sortStatusDir]);

  return (
    <div className="tw-container tw-mx-auto">
      <div className="tw-m-3 tw-p-3 tw-rounded-lg tw-bg-green-100">
        <div className="tw-text-center tw-p-5">
          <span className="tw-text-xl">Building Tickets and Internal Notes</span>
        </div>
        <div className="tw-grid tw-grid-cols-2">
          <div>
            <div className="info-inline">
              <div>ID:</div>
              <div>{binfo.building.building_id}</div>
            </div>
            <div className="info-inline">
              <div>Name:</div>
              <div>{binfo.building.name}</div>
            </div>
            <div className="info-inline">
              <div>Code:</div>
              <div>{binfo.building.code}</div>
            </div>
            <div className="info-inline">
              <div>Type:</div>
              <div>{binfo.building.type}</div>
            </div>
          </div>
          <div>
            <div className="info-inline">
              <div>Address:</div>
              <div>{binfo.building.address}</div>
            </div>
            <div className="info-inline">
              <div>City:</div>
              <div>{binfo.building.city}</div>
            </div>
            <div className="info-inline">
              <div>State:</div>
              <div>{binfo.building.state}</div>
            </div>
            <div className="info-inline">
              <div>Zip Code:</div>
              <div>{binfo.building.zip}</div>
            </div>
          </div>
        </div>
        <div>
          <div className="tw-text-center tw-text-xl tw-p-3">Internal Notes/Costs</div>
          <div className="tw-bg-white">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Ticket Code</th>
                  <th>Description</th>
                  <th>Cost</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {binfo.internal_notes.map((note, index) => {
                  return (
                    <tr key={index}>
                      <td>{note.ticket_code}</td>
                      <td>{note.description}</td>
                      <td>{note.cost}</td>
                      <td>{note.create_date}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="tw-bg-white">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Resident Info<br />
                    <span className="tw-italic tw-text-sm tw-font-normal">Name, Unit #, Residential Status, Email, Cell #</span>
                  </th>
                  <th>Ticket Info<br />
                    <span className="tw-italic tw-text-sm tw-font-normal">Code - Create Date/Time
                      Category
                      Attachment(s)</span></th>
                  <th>Category</th>
                  <th onClick={onSortStatus} className="tw-cursor-pointer">Status&nbsp;
                    {sortStatusDir == 'asc' && (<i className="fas fa-sort-up"></i>)}
                    {sortStatusDir == 'desc' && (<i className="fas fa-sort-down"></i>)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {binfo.tickets.map((ticket, index) => {
                  return (
                    <>
                      {detailIdx != ticket.ticket_id && (<tr key={index}>
                        <td nowrap>
                          {ticket.resident_name}
                        </td>
                        <td nowrap>
                          {ticket.code}
                        </td>
                        <td nowrap>
                          {ticket.ticket_category_name}
                        </td>
                        <td>
                          <div className={'tw-text-white tw-p-3 tw-text-center ' + (ticket.ticket_status_id == 1 ? 'tw-bg-green-400' : (ticket.ticket_status_id == 2 ? 'tw-bg-yellow-400' : 'tw-bg-red-400'))}>
                            {ticket.ticket_status_name}
                          </div>
                        </td>
                        <td nowrap>
                          <Button size="sm" variant="secondary" onClick={() => showDetail(ticket.ticket_id)}>More</Button>
                        </td>
                      </tr>)}
                      {detailIdx == ticket.ticket_id && (
                        <tr key={index}>
                          <td colSpan="6">
                            <table className="table">
                              <tbody>
                                <tr>
                                  <td nowrap>
                                    {ticket.resident_name}<br />
                                    {ticket.unit_number}<br />
                                    {ticket.residential_status}<br />
                                    {ticket.resident_email}<br />
                                    {ticket.cell_phone}<br />
                                  </td>
                                  <td nowrap>
                                    {ticket.code}<br />
                                    <div className="tw-text-sm">{ticket.create_date}</div>
                                    <div className="ticket-category-td">
                                      {ticket.ticket_category_name}
                                    </div>
                                    <a href={ticket.attachment1_url}>{ticket.attachment1}</a><br />
                                    <a href={ticket.attachment2_url}>{ticket.attachment2}</a><br />
                                    <div className={'tw-text-white tw-p-3 tw-text-center ' + (ticket.ticket_status_id == 1 ? 'tw-bg-green-400' : (ticket.ticket_status_id == 2 ? 'tw-bg-yellow-400' : 'tw-bg-red-400'))}>
                                      {ticket.ticket_status_name}
                                    </div>
                                  </td>
                                  <td colSpan="2" dangerouslySetInnerHTML={{ __html: ticket.description }}></td>
                                  <td>
                                    <Button size="sm" variant="secondary" onClick={() => setDetailIdx(-1)}>Less</Button>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>)}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div >
  );
}

import React, { useEffect, useState, useCallback, useMemo, Fragment } from 'react';
import differenceBy from 'lodash/differenceBy';
import { toast } from 'react-toastify';
import DataTable from 'react-data-table-component';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import { Breadcrumbs } from '../../../AbstractElements';
import HeaderCard from '../../Common/Component/HeaderCard';

const DataTables = () => { 
  const [data, setData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [toggleCleared, setToggleCleared] = useState(false);

  // ✅ Fetching user data from API
  useEffect(() => {
    const token = localStorage.getItem("Authorization"); // Assuming you stored token like this during login
  
    fetch('https://gks-yjdc.onrender.com/api/users', {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `${token}`, // 👈 Pass token here
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unauthorized or failed to fetch");
        }
        return response.json();
      })
      .then((resData) => {
        const formatted = resData.map((user) => ({
          id: user.user_id,
          name: user.name,
          relative_name: user.relative_name,
          email: user.email,
          gender: user.gender,
          address: user.address,
          dob: new Date(user.dob).toLocaleDateString(),
          phone: user.phone,
          whatsapp: user.whatsapp_no,
          status: user.isActive === 1 ? 'Active' : 'Inactive',
          role: user.isRole === 1 ? 'Admin' : user.isRole === 2 ? 'Subadmin' : 'User',
          created_at: new Date(user.created_at).toLocaleString(),
        }));
        setData(formatted);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        toast.error('Error fetching user data');
      });
  }, []);
  

  // ✅ Define table columns
  const tableColumns = [
    { name: 'ID', selector: (row) => row.id, sortable: true, center: true },
    { name: 'Name', selector: (row) => row.name, sortable: true, center: true },
    { name: 'Relative Name', selector: (row) => row.relative_name, center: true },
    { name: 'Email', selector: (row) => row.email, center: true },
    { name: 'Gender', selector: (row) => row.gender, center: true },
    { name: 'Address', selector: (row) => row.address, center: true },
    { name: 'DOB', selector: (row) => row.dob, center: true },
    { name: 'Phone', selector: (row) => row.phone, center: true },
    { name: 'WhatsApp', selector: (row) => row.whatsapp, center: true },
    { name: 'Role', selector: (row) => row.role, center: true },
    { name: 'Status', selector: (row) => row.status, center: true },
    { name: 'Created At', selector: (row) => row.created_at, center: true },
  ];

  // ✅ Row selection handling
  const handleRowSelected = useCallback((state) => {
    setSelectedRows(state.selectedRows);
  }, []);

  const contextActions = useMemo(() => {
    const handleDelete = () => {
      if (
        window.confirm(
          `Are you sure you want to delete:\r\n${selectedRows.map((r) => r.name).join(', ')}?`
        )
      ) {
        setToggleCleared(!toggleCleared);
        setData(differenceBy(data, selectedRows, 'id'));
        toast.success('Deleted successfully!');
      }
    };

    return (
      <button key="delete" className="btn btn-danger" onClick={handleDelete}>
        Delete
      </button>
    );
  }, [data, selectedRows, toggleCleared]);

  return (
    <Fragment>
      <Breadcrumbs parent="Table" title="User List Table" mainTitle="User List Table" />
      <Container fluid={true} className="datatables">
        <Row>
          <Col sm="12">
            <Card>
              <HeaderCard title="User Data Table with Multiple Selection and Delete" />
              <CardBody>
                <DataTable
                  data={data}
                  columns={tableColumns}
                  striped
                  center
                  highlightOnHover
                  pagination
                  selectableRows
                  persistTableHead
                  contextActions={contextActions}
                  onSelectedRowsChange={handleRowSelected}
                  clearSelectedRows={toggleCleared}
                />
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </Fragment>
  );
};

export default DataTables;

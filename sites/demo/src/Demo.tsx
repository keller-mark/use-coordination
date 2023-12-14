import React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { styled } from '@mui/material/styles';
import { Typography, Container, Unstable_Grid2 as Grid } from '@mui/material';
import { BaseExample } from '@use-coordination/provider-example';


const NavBarGrid = styled(Grid)`
  border-bottom: 1px solid gray;
` as typeof Grid;






export default function Demo() {

  return (
    <>
      <CssBaseline />
      <Container>
        <NavBarGrid container spacing={1} alignItems="center">
          <Grid container xs={3} alignItems="center">
            <Grid xs={6}>
              <Typography sx={{ whiteSpace: 'nowrap' }}>use-coordination</Typography>
            </Grid>
          </Grid>
        </NavBarGrid>
      
        <BaseExample />
      </Container>
    </>
  );
}
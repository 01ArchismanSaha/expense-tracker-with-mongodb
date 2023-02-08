const trackerFrom = document.getElementById('tracker-form');
const amount = document.getElementById('amount');
const description = document.getElementById('description');
const category = document.getElementById('category');
const expenseItems = document.getElementById('expense-items');
const expansionDiv = document.getElementById('expansion');
const baseUrl = `http://localhost:4000`;

trackerFrom.addEventListener('submit', async(e) => {
    e.preventDefault();
    console.log('frontend: ',amount.value, description.value, category.value);

    try {   
        await axios.post(`${baseUrl}/expense/add-expense`, {
            amount: amount.value,
            description: description.value,
            category: category.value
        },
        {
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        });
    
        const response = await fetchExpensesFromBackend(1);

        showExpensesOnFrontend(response.expenses);

    } catch (error) {
        console.log(error);
    }
});

window.addEventListener('DOMContentLoaded', async () => {
    checkForPremium();

    // const url = window.location.search;
    // const page = url.replace('?', '');

    // console.log('page->', page);

    const response = await fetchExpensesFromBackend(1);
    console.log(response);
    
    const expenses = response.expenses;

    showExpensesOnFrontend(expenses);

    addPagination(response);
});

expenseItems.addEventListener('click', async (e) => {
    // console.log('event target: ', e.target.parentElement.id);
    const id = e.target.parentElement.id;
    try {
        await axios.delete(`${baseUrl}/expense/delete-expense/${id}`, {
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        });

        expenseItems.removeChild(document.getElementById(`${id}`));
        
    } catch (error) {
        console.log(error);
    }

});

function showExpensesOnFrontend(expenses) {
    console.log('expenses: ', expenses);

    expenseItems.innerHTML = '';

    for(let i = 0; i < expenses.length; i ++){
        // console.log(expenses[i]);
        const expense = expenses[i];
        expenseItems.innerHTML += `
            <li id="${expense._id}">
                ${expense.amount}-${expense.description}-${expense.category}
                <button>Delete</button>
            </li>
        `;
    }    
};

async function fetchExpensesFromBackend(pageNo) {
    try {
        let rows = localStorage.getItem('rows');
        if(!rows) {
            rows = 5;
        }

        const response = await axios.get(`${baseUrl}/expense/get-expense/?page=${pageNo}`, {
            headers: {
                'Authorization': localStorage.getItem('token'),
                'rows': rows
            }
        });

        const expenses = response.data;
        return expenses;

    } catch (error) {
        console.log(error);
    }
}

document.getElementById('rzp-button1').onclick = async function (e) {
    // console.log('token: ', token);
    
    try {
        let token = localStorage.getItem('token');

        let response = await axios.post(`${baseUrl}/user/purchase-premium`, {}, {
            headers: {
                'Authorization': token
            }
        });

        // console.log('order response: ',response );
        var options = {
            "key": response.data.key_id, // Enter the Key ID generated from the Dashboard
            "name": "Test Company",
            "order_id": response.data.order.id, // For one time payment
            "prefill": {
                "name": "Test User",
                "email": "test.user@example.com",
                "contact": "7003442036"
                },
            "theme": {
                "color": "#3399cc"
                },
            // This handler function will handle the success payment
            "handler": function (response) {
                console.log(response);
                axios.post(`${baseUrl}/user/purchase-premium/update-transaction-status`,
                    {
                        order_id: options.order_id,
                        payment_id: response.razorpay_payment_id,
                    }, 
                    {   
                        headers: {"Authorization" : token} 
                    })
                    .then(() => {
                        alert('You are a Premium User Now');
                        checkForPremium();
                    }).catch(() => {
                        alert('Something went wrong. Try Again!!!');
                    })
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();
        e.preventDefault();

        rzp.on('payment.failed', function (response){
            alert(response.error.code);
            alert(response.error.description);
            alert(response.error.source);
            alert(response.error.step);
            alert(response.error.reason);
            alert(response.error.metadata.order_id);
            alert(response.error.metadata.payment_id);
        });
        
    } catch (error) {
        console.log(error);
    }
};

function applyDarkTheme() {
    const body = document.body;
    body.classList.add('dark-mode');
}

async function checkForPremium() {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${baseUrl}/user/check-membership`, {}, {
            headers: {
                'Authorization': token
            }
        });

        if (response.status === 200) {
            applyDarkTheme();
            addLeaderboard();
            showPreviousDownloads();
            document.getElementById('downloadexpense').style.display = "block";
            document.getElementById('prevDownloads-div').style.display = "block";
        }

    } catch (error) {
        console.log(error);
    }
}

async function addLeaderboard() {
    try {
        document.getElementById('leaderboard-div').style.display = "block";
        const leaderboard = document.getElementById('leaderboard');
        const response = await axios.get(`${baseUrl}/expense/get-leaderboard`, {
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        });
        
        console.log('leaderboard data :', response.data);
        sessionStorage.setItem('leaderboardData', JSON.stringify(response.data.data));
        leaderboard.innerHTML = '';

        response.data.data.forEach(userData => {
            // console.log(userData);
            // let totalExpense = 0;
            // const user = userData.user;
            // const expenseList = userData.expenses;

            // expenseList.forEach(expense => {
            //     totalExpense += expense.amount;
            // });

            // console.log(user.name, totalExpense);

            leaderboard.innerHTML += `
                <li id="${userData.userId}">${userData.name}-${userData.expenses.totalOfMonth}<button>View Details</button></li>
            `;
        });
    } catch (error) {
        console.log(error);
    }
}

async function showPreviousDownloads() {
    try {
        const downloads = document.getElementById('downloads');
        const response = await axios.get(`${baseUrl}/user/get-downloads`, {
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        });
        // console.log('response---->',response);
        downloads.innerHTML = '';

        response.data.downloads.forEach(download => {
            downloads.innerHTML += `<li>
                <a href="${download.fileUrl}">${download.date}</a>
            </li>`;
        });

    } catch (error) {
        console.log(error);
    }
}

document.getElementById('leaderboard').onclick = (e) => {
    e.preventDefault();

    // console.log(e.target.parentElement.id);
    const userId = e.target.parentElement.id;

    expandExpense(userId);

    expansionDiv.classList.add('active');
}

document.getElementById('close-list-btn').onclick = (e) => {
    e.preventDefault();
    expansionDiv.classList.remove('active');  
}

async function expandExpense(id) {
    try {
        // let response = await axios.get(`${baseUrl}/user/get-expansion/${id}`, {
        //     headers: {
        //         'Authorization': localStorage.getItem('token')
        //     }
        // });
        // console.log(response.data.expenses);
        console.log(id)
        const userData = JSON.parse(sessionStorage.getItem('leaderboardData'));
        // console.log(userData);
        const requiredUserData = userData.filter(u => u.userId == id)[0];
        console.log(requiredUserData)

        const expenses = requiredUserData.expenses.expenses;
        console.log('expansion data : ' + expenses);
        
        let expense_ul = document.querySelector('.expense-items');
        // console.log(expense_ul);
        expense_ul.innerHTML = '';
        expenses.forEach(expense => {
            expense_ul.innerHTML += `
                <li>${expense.description}-${expense.category}-${expense.amount}</li>
            `;
        });

    } catch (error) {
        console.log(error);
    }
}

function download(){
    axios.get(`${baseUrl}/user/download`, 
        { 
            headers: {"Authorization" : localStorage.getItem('token')} 
        }
    )
    .then((response) => {
        if(response.status === 201){
            //the bcakend is essentially sending a download link
            //  which if we open in browser, the file would download
            var a = document.createElement("a");
            a.href = response.data.fileUrl;
            a.download = 'myexpense.csv';
            a.click();
        } else {
            throw new Error(response.data.message)
        }

    })
    .catch((err) => {
        logErrorToUser(err);  
    });
}

function logErrorToUser(error) {
    const err = document.getElementById('error-text');
    err.innerHTML = error.message;
};

function addPagination(response) {
    const paginationDiv = document.querySelector('.pagination');
    paginationDiv.innerHTML = '';

    if(response.previousPage!==1 && response.currentPage!==1){
        paginationDiv.innerHTML += `
            <button>${1}</button>
        `;
        paginationDiv.innerHTML += '<<';
    }

    if(response.hasPreviousPage) {
        paginationDiv.innerHTML += `
            <button>${response.previousPage}</button>
        `;
    }

    paginationDiv.innerHTML += `
        <button class="active">${response.currentPage}</button>
    `;

    if(response.hasNextPage) {
        paginationDiv.innerHTML += `
            <button>${response.nextPage}</button>
        `;
    }

    if(response.currentPage !== response.lastPage && response.nextPage!==response.lastPage) {
        paginationDiv.innerHTML += '>>';
        paginationDiv.innerHTML += `
            <button>${response.lastPage}</button>
        `;
    }
}

document.querySelector('.pagination').onclick = async (e) => {
    e.preventDefault();

    const page = e.target.innerHTML;

    const response = await fetchExpensesFromBackend(page);
    console.log(response);
    
    const expenses = response.expenses;

    showExpensesOnFrontend(expenses);

    addPagination(response);
}

document.getElementById('row-selector').onchange = (e) => {
    
    e.preventDefault();
    
    localStorage.setItem('rows', e.target.value);

    window.location.reload();
}
